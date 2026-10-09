import { api } from '../lib/api';
import { FOOD_ID, foodInput } from '../lib/food-input';
import { foodExists, updateFood } from '../lib/food-store';
import { HttpError } from '../lib/http';
import { readBody } from '../lib/validate';

// PUT /api/admin/foods/:id { name, kind, icon, colour, per100, grams, density, allergens, origin,
// spice, active }: DevQuake staff change a food. The id never changes (recipes store it); to stop
// offering a food, save it with active: false.
export const PUT = api(async ({ request, params, db, user }) => {
  if (!user.isAdmin) throw new HttpError(403, 'adminOnly');
  const id = params.id ?? '';
  if (!FOOD_ID.test(id) || !(await foodExists(db, id))) throw new HttpError(404, 'notFound');
  await updateFood(db, foodInput(id, await readBody(request)));
});
