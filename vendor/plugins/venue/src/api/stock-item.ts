import { jsonBody, ownerApi } from '../lib/api';
import { HttpError } from '../lib/http';
import {
  changeStock,
  ingredientsOf,
  parseQty,
  removeIngredient,
  saveIngredient,
} from '../lib/stock';
import { ingredientInput } from '../lib/stock-input';

// PUT /api/stock/:id: { name, unit, dailyTarget, weeklyTarget } changes an ingredient, or
// { change: 'delivery' | 'waste' | 'count', qty } changes its stock; DELETE removes it.
export const PUT = ownerApi(async ({ request, params, db, venue, user }) => {
  const body = await jsonBody(request);
  const id = Number(params.id);
  let ok: boolean;
  if (body.change === 'delivery' || body.change === 'waste' || body.change === 'count') {
    const qty = parseQty(body.qty);
    if (qty === null) throw new HttpError(400, 'qty');
    ok = await changeStock(db, venue.id, id, body.change, qty, user.displayName);
  } else {
    ok = await saveIngredient(db, venue.id, id, ingredientInput(body));
  }
  if (!ok) throw new HttpError(404, 'notFound');
  return { ingredients: await ingredientsOf(db, venue.id) };
});

export const DELETE = ownerApi(async ({ params, db, venue }) => {
  if (!(await removeIngredient(db, venue.id, Number(params.id))))
    throw new HttpError(404, 'notFound');
  return { ingredients: await ingredientsOf(db, venue.id) };
});
