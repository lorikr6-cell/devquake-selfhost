import { api } from '../lib/api';
import { createSet, mealById, requireMember, setsOf } from '../lib/data';
import { HttpError } from '../lib/http';
import { readItems } from '../lib/items';
import { LIMITS, isSlot } from '../lib/plan';
import { id, optionalText, readBody, requiredText, wholeNumber } from '../lib/validate';

// GET /api/sets: the visitor's saved meals and the public ones, for "Add a saved meal".
export const GET = api(async ({ db, user }) => ({
  mine: await setsOf(db, user.id, 'mine'),
  community: (await setsOf(db, user.id, 'community')).filter((s) => s.ownerId !== user.id),
}));

// POST /api/sets { householdId, mealId } (save a planned meal) or { title, description?, slot,
// servings, items }: a new saved meal, private to the visitor.
export const POST = api(async ({ request, db, user, links }) => {
  const body = await readBody(request);
  if (body.mealId !== undefined) {
    const householdId = id(body.householdId);
    await requireMember(db, householdId, user.id);
    const meal = await mealById(db, householdId, id(body.mealId));
    if (!meal) throw new HttpError(404, 'mealNotFound');
    if (meal.items.length === 0) throw new HttpError(400, 'emptyMeal');
    return {
      id: await createSet(db, user, {
        title: meal.title,
        description: meal.note,
        slot: meal.slot,
        servings: meal.servings,
        items: meal.items,
      }),
    };
  }
  const servings = wholeNumber(body.servings, 'servings', 1, LIMITS.maxServings);
  const items = await readItems(body.items, links, servings);
  if (items.length === 0) throw new HttpError(400, 'emptyMeal');
  return {
    id: await createSet(db, user, {
      title: requiredText(body.title, 'mealTitle', LIMITS.mealTitle),
      description: optionalText(body.description, 'description', LIMITS.description),
      slot: isSlot(body.slot) ? body.slot : 'dinner',
      servings,
      items,
    }),
  };
});
