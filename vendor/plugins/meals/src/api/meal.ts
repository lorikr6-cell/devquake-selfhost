import { api } from '../lib/api';
import { deleteMeal, updateMeal } from '../lib/data';
import { id, mealChange, readBody } from '../lib/validate';

// PATCH /api/households/:id/meals/:mealId { day?, slot?, servings?, cooked?, leftovers?, note?,
// remind? }: everyone in the household (swap, mark cooked).
export const PATCH = api(async ({ request, params, db, user }) => {
  await updateMeal(
    db,
    id(params.id),
    id(params.mealId),
    user.id,
    mealChange(await readBody(request)),
  );
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteMeal(db, id(params.id), id(params.mealId), user.id);
});
