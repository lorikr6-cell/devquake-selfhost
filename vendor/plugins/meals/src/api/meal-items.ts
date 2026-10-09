import { api } from '../lib/api';
import { addMealItems, mealById } from '../lib/data';
import { HttpError } from '../lib/http';
import { readItems } from '../lib/items';
import { id, readBody } from '../lib/validate';

// POST /api/households/:id/meals/:mealId/items { items: [{ recipeRef } | { name, qty?, unit? }] }:
// more parts for a planned meal (a recipe as part of the meal, or an item).
export const POST = api(async ({ request, params, db, user, links }) => {
  const householdId = id(params.id);
  const mealId = id(params.mealId);
  const meal = await mealById(db, householdId, mealId);
  if (!meal) throw new HttpError(404, 'mealNotFound');
  const items = await readItems((await readBody(request)).items, links, meal.servings);
  if (items.length === 0) throw new HttpError(400, 'required', { field: 'itemName' });
  await addMealItems(db, householdId, mealId, user.id, items);
});
