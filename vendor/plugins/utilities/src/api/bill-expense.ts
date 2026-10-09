import { LOCALE_TAGS } from '@devquake/ui';
import { api } from '../lib/api';
import { billContext } from '../lib/data';
import { billAsExpense } from '../lib/expense-link';
import { formatters } from '../lib/format';
import { HttpError } from '../lib/http';
import { id, readBody } from '../lib/validate';

// POST /api/bills/:id/expense { groupId }: the owner puts the bill into a Shared expenses group,
// paid by them, with each participant's share from this app (link point expense.add, ADR 0035).
// Adding it again changes nothing ({ created: false }).
export const POST = api(async ({ request, params, db, user, locale, links }) => {
  const billId = id(params.id);
  const { utility, bill, split } = await billContext(db, billId, user.id);
  if (utility.role !== 'owner') throw new HttpError(403, 'ownerOnly');
  const groupId = id((await readBody(request)).groupId);
  const input = billAsExpense({
    groupId,
    billId,
    title: `${utility.name} · ${formatters(LOCALE_TAGS[locale]).month(bill.period)}`,
    total: bill.total,
    currency: utility.currency,
    dueOn: bill.dueOn,
    period: bill.period,
    lines: split.lines.map((l) => ({ userId: l.userId, share: l.share })),
  });
  if (!input) throw new HttpError(400, 'expenseNotReady');
  if (!links) throw new HttpError(503, 'expenseLinkFailed');
  const result = await links.call<{ groupId: number; expenseId: number; created: boolean }>(
    'expenses',
    'expense.add',
    input,
  );
  if (!result.ok) {
    const key =
      result.error === 'forbidden'
        ? 'expenseNotEveryone'
        : result.error === 'not-connected'
          ? 'expenseNotConnected'
          : 'expenseLinkFailed';
    throw new HttpError(result.error === 'forbidden' ? 400 : 502, key);
  }
  return {
    created: result.data.created,
    url: links.deepLink(
      'expenses',
      'expense',
      { id: String(result.data.groupId), expenseId: String(result.data.expenseId) },
      { returnTo: `/bills/${billId}` },
    ),
  };
});
