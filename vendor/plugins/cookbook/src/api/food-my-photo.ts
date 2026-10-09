import { api } from '../lib/api';
import { deleteMyFoodPhoto, saveMyFoodPhoto } from '../lib/food-photos';
import { FOOD_ID } from '../lib/food-input';
import { foodById, thumbOf } from '../lib/foods';
import { HttpError } from '../lib/http';
import { readPicture } from '../lib/picture';

const foodId = (raw: string | undefined) => {
  if (!raw || !FOOD_ID.test(raw)) throw new HttpError(404, 'notFound');
  return raw;
};

// PUT /api/foods/:id/my-photo with the image as the body (JPEG, PNG or WebP, at most 2 MB): the
// member's own picture of a food, shown only to them until staff choose it for everyone.
// Answers { thumb }: the food's thumbnail for the member now.
export const PUT = api(async ({ request, params, db, user }) => {
  const id = foodId(params.id);
  const picture = await readPicture(request);
  const photo = await saveMyFoodPhoto(db, id, user.id, picture);
  return { thumb: thumbOf(foodById(id)!, { [id]: photo }) };
});

// DELETE …/my-photo: back to what everyone sees; answers { thumb }.
export const DELETE = api(async ({ params, db, user }) => {
  const id = foodId(params.id);
  await deleteMyFoodPhoto(db, id, user.id);
  const food = foodById(id);
  return { thumb: food ? thumbOf(food) : null };
});
