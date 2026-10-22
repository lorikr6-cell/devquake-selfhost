import { api } from '../lib/api';
import { deleteMealTime, saveMealTime } from '../lib/meals-data';
import { id, readBody } from '../lib/validate';
import { mealTimeInput } from './meal-times';

// PATCH /api/orgs/:id/meal-times/:mealTimeId { name, starts, ends }.
export const PATCH = api(async ({ request, params, db, user }) => {
  await saveMealTime(
    db,
    id(params.id),
    user.id,
    mealTimeInput(await readBody(request)),
    id(params.mealTimeId),
  );
});

// DELETE …: removes the meal time with its menus.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteMealTime(db, id(params.id), id(params.mealTimeId), user.id);
});
