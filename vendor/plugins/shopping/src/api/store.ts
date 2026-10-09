import { api } from '../lib/api';
import { deleteStore, updateStore } from '../lib/mutations';
import { id, readBody, storeInput } from '../lib/validate';

// PATCH /api/lists/:id/stores/:storeId { name, type?, location?, description? }
export const PATCH = api(async ({ request, params, db, user }) => {
  const input = storeInput(await readBody(request));
  await updateStore(db, id(params.id), id(params.storeId), user, input);
});

// DELETE: the store's items stay on the list, without a store.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteStore(db, id(params.id), id(params.storeId), user);
});
