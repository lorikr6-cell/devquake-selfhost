import { api } from '../lib/api';
import { deleteMealItem } from '../lib/data';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// DELETE /api/households/:id/meals/:mealId/items/:index: removes one part (index as shown, from 0).
export const DELETE = api(async ({ params, db, user }) => {
  const index = Number(params.index);
  if (!Number.isInteger(index) || index < 0) throw new HttpError(404, 'itemNotFound');
  await deleteMealItem(db, id(params.id), id(params.mealId), index, user.id);
});
