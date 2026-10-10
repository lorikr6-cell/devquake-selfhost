import { api, mine } from '../lib/api';
import { createVendor } from '../lib/catalog-data';
import { readBody, vendorInput } from '../lib/validate';

// POST /api/vendors { name, contactName, email, phone, website, notes, isBrand }
export const POST = api('products', async ({ request, db, store }) => {
  const id = await createVendor(db, mine(store).id, vendorInput(await readBody(request)));
  return { id };
});
