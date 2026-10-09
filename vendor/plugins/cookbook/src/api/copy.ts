import { api } from '../lib/api';
import { copyRecipe, isRef } from '../lib/data';
import { HttpError } from '../lib/http';
import { readBody } from '../lib/validate';

// POST /api/copy { ref }: a library or shared recipe becomes the visitor's own copy to change.
export const POST = api(async ({ request, db, user, locale }) => {
  const { ref } = await readBody(request);
  if (!isRef(ref)) throw new HttpError(404, 'recipeNotFound');
  return { id: await copyRecipe(db, user, ref, locale) };
});
