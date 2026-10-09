import { api } from '../lib/api';
import { getRecipe } from '../lib/cookbook';
import { setById, setSetPublic } from '../lib/data';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// POST /api/sets/:id/publish: the owner makes the saved meal public (every member of the app may
// use, recommend and comment on it). Its recipes must be library or public cookbook recipes, so
// others can read them (checked through the cookbook's recipe.get).
export const POST = api(async ({ params, db, user, links }) => {
  const set = await setById(db, id(params.id), user.id);
  if (!set || set.ownerId !== user.id) throw new HttpError(404, 'setNotFound');
  const blocked: string[] = [];
  for (const item of set.items) {
    if (!item.recipeRef) continue;
    const recipe = await getRecipe(links, item.recipeRef, set.servings);
    if (!recipe) throw new HttpError(502, 'cookbookFailed');
    if (recipe.visibility !== 'library' && recipe.visibility !== 'public') blocked.push(item.name);
  }
  if (blocked.length) throw new HttpError(400, 'privateRecipes', { names: blocked.join(', ') });
  await setSetPublic(db, set.id, user.id, true);
});

// DELETE /api/sets/:id/publish: private again (recommendations and comments are kept).
export const DELETE = api(async ({ params, db, user }) => {
  await setSetPublic(db, id(params.id), user.id, false);
});
