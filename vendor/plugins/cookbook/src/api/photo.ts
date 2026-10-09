import { api } from '../lib/api';
import { deleteRecipePhoto, readRecipePhoto, saveRecipePhoto } from '../lib/data';
import { pictureResponse, readPicture, wantsThumb } from '../lib/picture';
import { id } from '../lib/validate';

// GET /api/recipes/:id/photo[?v=][&size=thumb]: the photo, for whoever may see the recipe.
export const GET = api(async ({ request, params, db, user }) =>
  pictureResponse(request, await readRecipePhoto(db, id(params.id), user.id, wantsThumb(request))),
);

// PUT …/photo with the image as the body (JPEG, PNG or WebP, at most 2 MB): the owner.
export const PUT = api(async ({ request, params, db, user }) => {
  const picture = await readPicture(request);
  await saveRecipePhoto(db, id(params.id), user.id, picture);
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteRecipePhoto(db, id(params.id), user.id);
});
