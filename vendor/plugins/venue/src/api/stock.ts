import { jsonBody, ownerApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { changeStock, ingredientsOf, parseQty, saveIngredient } from '../lib/stock';
import { ingredientInput } from '../lib/stock-input';

// The venue's stock (the owner's): GET the ingredients; POST { name, unit, dailyTarget,
// weeklyTarget } adds one; POST { count: 'daily' | 'weekly', counts: [{ id, qty }] } saves a count.
export const GET = ownerApi(async ({ db, venue }) => ({
  ingredients: await ingredientsOf(db, venue.id),
}));

export const POST = ownerApi(async ({ request, db, venue, user }) => {
  const body = await jsonBody(request);
  if (body.count === 'daily' || body.count === 'weekly') {
    const counts = Array.isArray(body.counts) ? body.counts.slice(0, 1000) : [];
    for (const c of counts as { id?: unknown; qty?: unknown }[]) {
      const qty = parseQty(c.qty);
      if (qty === null) continue;
      await changeStock(db, venue.id, Number(c.id), 'count', qty, user.displayName, body.count);
    }
  } else {
    await saveIngredient(db, venue.id, null, ingredientInput(body));
  }
  return { ingredients: await ingredientsOf(db, venue.id) };
});
