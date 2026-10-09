import { api } from '../lib/api';
import { addItem } from '../lib/mutations';
import { id, itemInput, readBody } from '../lib/validate';

// POST /api/lists/:id/items { name, unit, quantity?, price?, description?, storeId?, photoFrom? }
// photoFrom: an earlier item whose photo is copied (from a suggestion).
export const POST = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const photoFrom =
    body.photoFrom === undefined || body.photoFrom === null || body.photoFrom === ''
      ? null
      : id(body.photoFrom);
  const itemId = await addItem(db, id(params.id), user, itemInput(body), photoFrom);
  return Response.json({ id: itemId }, { status: 201 });
});
