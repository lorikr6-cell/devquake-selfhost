import { jsonBody, ownerApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { ingredientsOf, parseQty, recipesOf, saveRecipe } from '../lib/stock';

// GET /api/items/:id/recipe: the item's recipe and the venue's ingredients; PUT { lines: [{
// ingredientId, qty }] } replaces it (what one of the item uses).
export const GET = ownerApi(async ({ params, db, venue }) => {
  const id = Number(params.id);
  const [recipes, ingredients] = await Promise.all([
    recipesOf(db, venue.id),
    ingredientsOf(db, venue.id),
  ]);
  return {
    lines: recipes
      .filter((r) => r.itemId === id)
      .map((r) => ({ ingredientId: r.ingredientId, qty: r.qty })),
    ingredients: ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit })),
  };
});

export const PUT = ownerApi(async ({ request, params, db, venue }) => {
  const raw = (await jsonBody(request)).lines;
  const lines = (Array.isArray(raw) ? raw : []).map(
    (l: { ingredientId?: unknown; qty?: unknown }) => ({
      ingredientId: Number(l.ingredientId),
      qty: parseQty(l.qty) ?? 0,
    }),
  );
  if (!(await saveRecipe(db, venue.id, Number(params.id), lines)))
    throw new HttpError(404, 'notFound');
});
