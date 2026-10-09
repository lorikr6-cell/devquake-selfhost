import { api } from '../lib/api';
import { checksOf } from '../lib/checks';
import { recipeByRef, setPublic } from '../lib/data';
import { publishable } from '../lib/guide';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// POST /api/recipes/:id/publish: the author makes the recipe public (every member of the app sees
// it, may recommend and comment). Only when the required checks pass (lib/guide.ts).
export const POST = api(async ({ params, db, user, locale }) => {
  const recipeId = id(params.id);
  const r = await recipeByRef(db, String(recipeId), user.id, locale);
  if (!r || r.ownerId !== user.id) throw new HttpError(404, 'recipeNotFound');
  if (!publishable(checksOf(r))) throw new HttpError(400, 'notComplete');
  await setPublic(db, recipeId, user.id, true);
});

// DELETE /api/recipes/:id/publish: private again (recommendations and comments are kept).
export const DELETE = api(async ({ params, db, user }) => {
  await setPublic(db, id(params.id), user.id, false);
});
