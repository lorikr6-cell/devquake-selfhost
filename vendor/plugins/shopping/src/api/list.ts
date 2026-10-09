import { api } from '../lib/api';
import { requireMember, snapshot } from '../lib/data';
import { deleteList, updateList } from '../lib/mutations';
import { currency, id, readBody, requiredText, shopDate } from '../lib/validate';

// GET /api/lists/:id[?v=<version>]: the list, or 204 when that version is still current
// (open lists poll this every few seconds).
export const GET = api(async ({ request, params, db, user }) => {
  const listId = id(params.id);
  const known = new URL(request.url).searchParams.get('v');
  if (known) {
    const list = await requireMember(db, listId, user.id);
    if (String(list.version) === known) return undefined;
  }
  return snapshot(db, listId, user.id);
});

// PATCH /api/lists/:id { name?, currency?, shopDate? }: owner only.
export const PATCH = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await updateList(db, id(params.id), user, {
    name: body.name === undefined ? undefined : requiredText(body.name, 'listName', 80),
    currency: body.currency === undefined ? undefined : currency(body.currency),
    shopDate: body.shopDate === undefined ? undefined : shopDate(body.shopDate),
  });
});

// DELETE /api/lists/:id: owner only, removes everything on it.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteList(db, id(params.id), user);
});
