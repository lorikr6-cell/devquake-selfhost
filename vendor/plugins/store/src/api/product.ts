import { api, mine } from '../lib/api';
import { deleteProduct, updateProduct } from '../lib/data';
import { readProduct } from '../lib/product-input';
import { id } from '../lib/validate';

// PUT /api/products/:id: the product, its options (options left out are removed) and its
// field values.
export const PUT = api('products', async ({ request, params, db, store, timeZone }) => {
  const storeId = mine(store).id;
  const variantIds = await updateProduct(
    db,
    storeId,
    id(params.id),
    await readProduct(db, storeId, request, timeZone),
  );
  // The options' ids in the form's order, so new options are not added twice on the next save.
  return { variantIds };
});

// DELETE /api/products/:id: the product, its options and photos (orders keep their copy).
export const DELETE = api('products', async ({ params, db, store }) => {
  await deleteProduct(db, mine(store).id, id(params.id));
});
