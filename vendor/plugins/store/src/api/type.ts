import { api, mine } from '../lib/api';
import { deleteType, updateType } from '../lib/catalog-data';
import { id, readBody, typeInput } from '../lib/validate';

// PUT /api/types/:id { name, fields }: fields left out are removed with their values.
export const PUT = api('products', async ({ request, params, db, store }) => {
  await updateType(db, mine(store).id, id(params.id), typeInput(await readBody(request)));
});

// DELETE /api/types/:id: the type and its fields; its products stay.
export const DELETE = api('products', async ({ params, db, store }) => {
  await deleteType(db, mine(store).id, id(params.id));
});
