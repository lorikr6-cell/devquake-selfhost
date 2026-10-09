import { translator } from '../i18n';
import { api } from '../lib/api';
import { isRef, recipeByRef } from '../lib/data';
import { HttpError } from '../lib/http';
import { LIMITS, scaledIngredient } from '../lib/recipe';
import { id, readBody, wholeNumber } from '../lib/validate';

// POST /api/shopping { ref, servings, listId, skip? }: the recipe's ingredients for `servings`
// go to one of the visitor's shopping lists (shopping link point list.add-items, ADR 0035).
// `skip` = positions of ingredients already at home.
export const POST = api(async ({ request, db, user, locale, links }) => {
  const body = await readBody(request);
  if (!isRef(body.ref)) throw new HttpError(404, 'recipeNotFound');
  const recipe = await recipeByRef(db, body.ref, user.id, locale);
  if (!recipe) throw new HttpError(404, 'recipeNotFound');
  const servings = wholeNumber(body.servings, 'servings', 1, LIMITS.maxServings);
  const listId = id(body.listId);
  const tUnit = translator(locale, 'units');
  const skip = new Set(Array.isArray(body.skip) ? body.skip.map(Number) : []);
  const items = recipe.ingredients
    .map((i, n) => ({ i: scaledIngredient(i, recipe.servings, servings), n }))
    .filter(({ i, n }) => !skip.has(n) && i.unit !== 'taste')
    .map(({ i }) => ({ name: i.name, quantity: i.qty, unit: tUnit(i.unit) }));
  if (items.length === 0) throw new HttpError(400, 'nothingToAdd');
  if (!links) throw new HttpError(503, 'linkFailed');
  const result = await links.call('shopping', 'list.add-items', {
    listId,
    items: items.slice(0, 30),
  });
  if (!result.ok) throw new HttpError(result.error === 'not-connected' ? 409 : 502, 'linkFailed');
  return { added: items.length };
});
