import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { correctPrice } from '../lib/mutations';
import { id, price, readBody } from '../lib/validate';

// PUT /api/lists/:id/items/:itemId/price { price }: the price paid in the store (shopping mode).
// The planned price is kept as the estimate; both go into the price history.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const value = price(body.price);
  if (value === null) throw new HttpError(400, 'price');
  await correctPrice(db, id(params.id), id(params.itemId), user, value);
});
