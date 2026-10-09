import { api } from '../lib/api';
import { chooseFoodPhoto, resetFoodPhoto } from '../lib/food-photos';
import { FOOD_ID } from '../lib/food-input';
import { foodById } from '../lib/foods';
import { HttpError } from '../lib/http';
import { readBody } from '../lib/validate';

const food = (raw: string | undefined) => {
  if (!raw || !FOOD_ID.test(raw) || !foodById(raw)) throw new HttpError(404, 'notFound');
  return raw;
};

// PUT /api/admin/foods/:id/photo { photoId }: DevQuake staff show a member's picture of the food
// to everyone instead of the drawn thumbnail.
export const PUT = api(async ({ request, params, db, user }) => {
  if (!user.isAdmin) throw new HttpError(403, 'adminOnly');
  const body = await readBody(request);
  const photoId = Number(body.photoId);
  if (!Number.isSafeInteger(photoId) || photoId <= 0) throw new HttpError(404, 'notFound');
  await chooseFoodPhoto(db, food(params.id), photoId);
});

// DELETE …/photo: back to the drawn thumbnail for everyone.
export const DELETE = api(async ({ params, db, user }) => {
  if (!user.isAdmin) throw new HttpError(403, 'adminOnly');
  await resetFoodPhoto(db, food(params.id));
});
