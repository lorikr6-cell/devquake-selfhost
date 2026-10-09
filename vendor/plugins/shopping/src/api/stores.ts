import { api } from '../lib/api';
import { addStore } from '../lib/mutations';
import { id, readBody, storeInput } from '../lib/validate';

// POST /api/lists/:id/stores { name, type?, location?, description? }. The type is filled in
// from well-known chain names when omitted; a duplicate returns the existing store.
export const POST = api(async ({ request, params, db, user }) => {
  const input = storeInput(await readBody(request));
  const storeId = await addStore(db, id(params.id), user, input);
  return Response.json({ id: storeId }, { status: 201 });
});
