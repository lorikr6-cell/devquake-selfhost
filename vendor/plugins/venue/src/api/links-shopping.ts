import { jsonBody, ownerApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { setVenueLink, shoppingLists, venueLink } from '../lib/links';

// The venue's purchasing list in Shopping (its costs; ADR 0035). GET: the member's lists and the
// chosen one; PUT { listId } chooses one (null: none). Needs the two apps connected.

export const GET = ownerApi(async ({ db, venue, ctx }) => {
  const lists = ctx.links ? await shoppingLists(ctx.links) : null;
  return { lists, chosen: await venueLink(db, venue.id, 'shoppingList') };
});

export const PUT = ownerApi(async ({ request, db, venue, ctx }) => {
  const raw = (await jsonBody(request)).listId;
  if (raw === null) {
    await setVenueLink(db, venue.id, 'shoppingList', null);
    return { chosen: null };
  }
  const lists = ctx.links ? await shoppingLists(ctx.links) : null;
  if (!lists) throw new HttpError(409, 'notConnected');
  const list = lists.find((l) => l.id === Number(raw));
  if (!list) throw new HttpError(404, 'notFound');
  await setVenueLink(db, venue.id, 'shoppingList', { ref: String(list.id), name: list.name });
  return { chosen: { ref: String(list.id), name: list.name } };
});
