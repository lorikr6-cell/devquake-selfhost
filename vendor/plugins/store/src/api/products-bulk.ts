import { api, mine } from '../lib/api';
import { bulkProducts } from '../lib/data';
import { HttpError } from '../lib/http';
import { id, readBody } from '../lib/validate';

// POST /api/products/bulk { ids, action: publish | unpublish | delete }: from the product list.
export const POST = api('products', async ({ request, db, store }) => {
  const body = await readBody(request);
  const action = body.action;
  if (action !== 'publish' && action !== 'unpublish' && action !== 'delete')
    throw new HttpError(400, 'invalidRequest');
  if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > 500)
    throw new HttpError(400, 'invalidRequest');
  const changed = await bulkProducts(db, mine(store).id, [...new Set(body.ids.map(id))], action);
  return { changed };
});
