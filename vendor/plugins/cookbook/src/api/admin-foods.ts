import { api } from '../lib/api';
import { foodIdInput, foodInput } from '../lib/food-input';
import { foodExists, insertFood } from '../lib/food-store';
import { HttpError } from '../lib/http';
import { readBody } from '../lib/validate';

// POST /api/admin/foods { id, name: { en, de, ro, hu }, kind, icon, colour, per100, grams,
// density, allergens, origin, spice, active }: DevQuake staff add a food to the catalogue.
export const POST = api(async ({ request, db, user }) => {
  if (!user.isAdmin) throw new HttpError(403, 'adminOnly');
  const body = await readBody(request);
  const id = foodIdInput(body.id);
  if (await foodExists(db, id)) throw new HttpError(409, 'foodExists');
  await insertFood(db, foodInput(id, body));
  return { id };
});
