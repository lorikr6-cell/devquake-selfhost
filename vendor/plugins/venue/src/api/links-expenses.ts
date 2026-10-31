import { jsonBody, ownerApi } from '../lib/api';
import { addDays } from '../lib/dates';
import { HttpError } from '../lib/http';
import {
  bookExpense,
  byCurrency,
  expenseGroups,
  idsOf,
  purchases,
  setVenueLink,
  utilityBills,
  venueLink,
} from '../lib/links';

// The venue's costs in Expenses (ADR 0035): GET the member's groups and the chosen one; PUT
// { groupId } chooses one (null: none); POST { kind: 'purchases' | 'utilities', month } books that
// month's purchases (from Shopping) or utility bills (from Utilities) as one expense, paid by the
// owner. Booking the same month twice adds nothing (the source is the same).

export const GET = ownerApi(async ({ db, venue, ctx }) => ({
  groups: ctx.links ? await expenseGroups(ctx.links) : null,
  chosen: await venueLink(db, venue.id, 'expensesGroup'),
}));

export const PUT = ownerApi(async ({ request, db, venue, ctx }) => {
  const raw = (await jsonBody(request)).groupId;
  if (raw === null) {
    await setVenueLink(db, venue.id, 'expensesGroup', null);
    return { chosen: null };
  }
  const groups = ctx.links ? await expenseGroups(ctx.links) : null;
  if (!groups) throw new HttpError(409, 'notConnected');
  const g = groups.find((x) => x.id === Number(raw));
  if (!g) throw new HttpError(404, 'notFound');
  await setVenueLink(db, venue.id, 'expensesGroup', { ref: String(g.id), name: g.name });
  return { chosen: { ref: String(g.id), name: g.name } };
});

export const POST = ownerApi(async ({ request, db, venue, ctx, user }) => {
  const body = await jsonBody(request);
  const month = String(body.month ?? '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, 'generic');
  if (!ctx.links) throw new HttpError(409, 'notConnected');
  const group = await venueLink(db, venue.id, 'expensesGroup');
  if (!group) throw new HttpError(409, 'noExpensesGroup');
  const groups = await expenseGroups(ctx.links);
  const g = groups?.find((x) => String(x.id) === group.ref);
  if (!g) throw new HttpError(409, 'notConnected');
  const [y, m] = month.split('-').map(Number) as [number, number];
  const first = `${month}-01`;
  const last = addDays(
    m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`,
    -1,
  );
  let amount = 0;
  let currency = g.currency;
  let title = '';
  if (body.kind === 'utilities') {
    const bills = await utilityBills(
      ctx.links,
      idsOf((await venueLink(db, venue.id, 'utilities'))?.ref),
      first,
      last,
    );
    if (!bills) throw new HttpError(409, 'notConnected');
    const sums = byCurrency(bills);
    const same = sums.find((s) => s.currency === g.currency);
    if (!same || sums.length > 1)
      throw new HttpError(409, 'currencyMismatch', { currency: g.currency });
    amount = same.total;
    title = `${venue.name}: utilities ${month}`;
  } else {
    const list = await venueLink(db, venue.id, 'shoppingList');
    if (!list) throw new HttpError(409, 'noShoppingList');
    const bought = await purchases(ctx.links, Number(list.ref), first, last);
    if (!bought) throw new HttpError(409, 'notConnected');
    if (bought.currency !== g.currency)
      throw new HttpError(409, 'currencyMismatch', { currency: g.currency });
    amount = bought.total;
    currency = bought.currency;
    title = `${venue.name}: purchases ${month}`;
  }
  if (amount <= 0) throw new HttpError(409, 'nothingToBook');
  const r = await bookExpense(ctx.links, {
    groupId: g.id,
    title: title.slice(0, 80),
    amount,
    currency,
    spentOn: last,
    source: `venue:${body.kind === 'utilities' ? 'utilities' : 'purchases'}:${venue.id}:${month}`,
    userId: user.id,
  });
  if (!r.ok) throw new HttpError(409, 'bookFailed');
  return { created: r.data.created !== false, amount, currency, group: g.name };
});
