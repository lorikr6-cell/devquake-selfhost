import { api, mine } from '../lib/api';
import { createProduct } from '../lib/data';
import { readProduct } from '../lib/product-input';

// POST /api/products { name, slug?, summary, description, seoTitle, seoDescription, gtin,
// category, typeId, vendorId, values, vatRate, published, variants }
export const POST = api('products', async ({ request, db, store, timeZone }) => {
  const storeId = mine(store).id;
  const id = await createProduct(db, storeId, await readProduct(db, storeId, request, timeZone));
  return { id };
});
