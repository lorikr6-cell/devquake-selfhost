import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { addRecipeToDay } from '../lib/data';
import { isIsoDate } from '../lib/dates';
import { HttpError } from '../lib/http';
import { LIMITS, isSlot } from '../lib/plan';
import { RECIPE_REF } from '../lib/validate';

const num = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null;

/**
 * Link point "meal.add" (write, ADR 0035): the cookbook plans a recipe for the member. Input
 * { householdId, day, slot, ref, title, servings, perPortion?: { kcal, protein, carbs, fat } }.
 * The recipe joins the meal already planned for that day and slot as one of its parts, or becomes
 * a new meal. Reply { mealId }.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const raw = (input ?? {}) as Record<string, unknown>;
  const householdId = Number(raw.householdId);
  const servings = Number(raw.servings);
  const title =
    typeof raw.title === 'string'
      ? raw.title.replace(/\s+/g, ' ').trim().slice(0, LIMITS.itemName)
      : '';
  if (
    !Number.isSafeInteger(householdId) ||
    householdId <= 0 ||
    !isIsoDate(raw.day) ||
    !isSlot(raw.slot) ||
    typeof raw.ref !== 'string' ||
    !RECIPE_REF.test(raw.ref) ||
    !title ||
    !Number.isInteger(servings) ||
    servings < 1 ||
    servings > LIMITS.maxServings
  ) {
    return { ok: false, error: 'invalid-input' };
  }
  const per = (raw.perPortion ?? {}) as Record<string, unknown>;
  try {
    const mealId = await addRecipeToDay(ctx.db, householdId, ctx.user.id, {
      day: raw.day,
      slot: raw.slot,
      servings,
      item: {
        recipeRef: raw.ref,
        name: title,
        qty: null,
        unit: null,
        kcal: num(per.kcal),
        protein: num(per.protein),
        carbs: num(per.carbs),
        fat: num(per.fat),
      },
    });
    return { ok: true, data: { mealId } };
  } catch (err) {
    if (err instanceof HttpError)
      return { ok: false, error: err.status === 404 ? 'not-found' : 'invalid-input' };
    throw err;
  }
};

export default handler;
