import { api, mine } from '../lib/api';
import { deleteVendor, updateVendor } from '../lib/catalog-data';
import { id, readBody, vendorInput } from '../lib/validate';

export const PUT = api('products', async ({ request, params, db, store }) => {
  await updateVendor(db, mine(store).id, id(params.id), vendorInput(await readBody(request)));
});

// DELETE /api/vendors/:id: its products stay, without a vendor.
export const DELETE = api('products', async ({ params, db, store }) => {
  await deleteVendor(db, mine(store).id, id(params.id));
});
