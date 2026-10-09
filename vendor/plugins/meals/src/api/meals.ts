import { api } from '../lib/api';
import { addMeal, eatersOf, requireMember, setById } from '../lib/data';
import { HttpError } from '../lib/http';
import { readItems, recipeItem } from '../lib/items';
import { LIMITS, householdServings, titleFromItems } from '../lib/plan';
import { day, id, optionalText, readBody, slot, wholeNumber } from '../lib/validate';

// POST /api/households/:id/meals { day, slot, title?, servings?, leftovers?, note?, remind?,
// items?: [{ recipeRef } | { name, qty?, unit? }], recipeRef?, setId? }: plans a meal made of
// parts (cookbook recipes, with their title and nutrition per portion copied via recipe.get, and
// simple items), or a copy of a saved meal.
export const POST = api(async ({ request, params, db, user, links }) => {
  const householdId = id(params.id);
  await requireMember(db, householdId, user.id);
  const body = await readBody(request);
  const servings =
    body.servings === undefined || body.servings === null || body.servings === ''
      ? householdServings((await eatersOf(db, householdId)).map((e) => e.portion))
      : wholeNumber(body.servings, 'servings', 1, LIMITS.maxServings);
  let setId: number | null = null;
  let items;
  let fallbackTitle: string | null = null;
  if (body.setId !== undefined && body.setId !== null && body.setId !== '') {
    const set = await setById(db, id(body.setId), user.id);
    if (!set) throw new HttpError(404, 'setNotFound');
    setId = set.id;
    items = set.items;
    fallbackTitle = set.title;
  } else if (typeof body.recipeRef === 'string' && body.recipeRef) {
    items = [await recipeItem(links, body.recipeRef, servings)];
  } else {
    items = await readItems(body.items, links, servings);
  }
  const title =
    optionalText(body.title, 'mealTitle', LIMITS.mealTitle) ??
    fallbackTitle ??
    (items.length ? titleFromItems(items) : null);
  if (!title) throw new HttpError(400, 'required', { field: 'mealTitle' });
  return {
    id: await addMeal(db, householdId, user.id, {
      day: day(body.day),
      slot: slot(body.slot),
      title,
      servings,
      leftovers: body.leftovers === true,
      note: optionalText(body.note, 'note', LIMITS.note),
      remind: optionalText(body.remind, 'remind', LIMITS.remind),
      setId,
      items,
    }),
  };
});
