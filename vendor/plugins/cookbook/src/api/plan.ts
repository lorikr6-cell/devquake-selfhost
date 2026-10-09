import { api } from '../lib/api';
import { isRef, recipeByRef } from '../lib/data';
import { isIsoDate } from '../lib/dates';
import { HttpError } from '../lib/http';
import { LIMITS, nutritionOf } from '../lib/recipe';
import { id, readBody, wholeNumber } from '../lib/validate';

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

// POST /api/plan { ref, householdId, day, slot, servings }: puts the recipe in a meal of the
// visitor's meal plan (meal planner link point meal.add, ADR 0035), with its title and nutrition
// per portion.
export const POST = api(async ({ request, db, user, locale, links }) => {
  const body = await readBody(request);
  if (!isRef(body.ref)) throw new HttpError(404, 'recipeNotFound');
  const r = await recipeByRef(db, body.ref, user.id, locale);
  if (!r) throw new HttpError(404, 'recipeNotFound');
  if (!isIsoDate(body.day) || !SLOTS.includes(String(body.slot)))
    throw new HttpError(400, 'invalidRequest');
  const servings = wholeNumber(body.servings, 'servings', 1, LIMITS.maxServings);
  if (!links) throw new HttpError(503, 'mealsFailed');
  const per = nutritionOf(r.ingredients, r.servings);
  const result = await links.call<{ mealId: number }>('meals', 'meal.add', {
    householdId: id(body.householdId),
    day: body.day,
    slot: body.slot,
    ref: r.ref,
    title: r.title,
    servings,
    perPortion:
      per.counted > 0
        ? {
            kcal: Math.round(per.perPortion.kcal),
            protein: Math.round(per.perPortion.protein * 10) / 10,
            carbs: Math.round(per.perPortion.carbs * 10) / 10,
            fat: Math.round(per.perPortion.fat * 10) / 10,
          }
        : null,
  });
  if (!result.ok) throw new HttpError(result.error === 'not-connected' ? 409 : 502, 'mealsFailed');
  return { mealId: result.data.mealId };
});
