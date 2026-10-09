import { api } from '../lib/api';
import { isRef, setFavourite } from '../lib/data';
import { HttpError } from '../lib/http';
import { readBody } from '../lib/validate';

// POST /api/favourites { ref, on }: adds or removes a favourite.
export const POST = api(async ({ request, db, user, locale }) => {
  const { ref, on } = await readBody(request);
  if (!isRef(ref)) throw new HttpError(404, 'recipeNotFound');
  await setFavourite(db, user, ref, on === true, locale);
});
