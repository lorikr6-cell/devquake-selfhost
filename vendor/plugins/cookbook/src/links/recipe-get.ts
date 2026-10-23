import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { isLocale } from '@devquake/ui';
import { loadFoods } from '../lib/food-store';
import { isRef, recipeByRef } from '../lib/data';
import { NUTRIENTS } from '../lib/foods';
import { LIMITS, allergensOf, nutritionOf, scaledIngredient } from '../lib/recipe';

/** Apps that cook for many people at once: they may ask for more servings. */
const BIG_KITCHENS = new Set(['canteen']);
const BIG_KITCHEN_SERVINGS = 500;

/**
 * Link point "recipe.get" (read, ADR 0035): one recipe the member can see, scaled to
 * `servings`: { ref, title, servings, baseServings, minutes, ingredients: [{ name, qty, unit,
 * foodId, baseQty, scaling }], perPortion: { kcal, protein, carbs, fat, fibre, salt },
 * allergens, visibility }. Input { ref, servings? }. `baseQty` is the amount for `baseServings`
 * and `scaling` how it grows (linear; whole: rounded to whole pieces, at least 1; spice: by the
 * factor to the power 0.75; fixed: unchanged), so a caller that keeps a copy can scale it alike.
 * Servings go up to 50, for big kitchens (the Social canteen) up to 500. visibility: 'library', 'public', 'shared' or 'private' (other members can
 * read library and public recipes; a public meal may only use those).
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  const raw = (input ?? {}) as Record<string, unknown>;
  if (!isRef(raw.ref)) return { ok: false, error: 'invalid-input' };
  const locale = isLocale(ctx.locale) ? ctx.locale : 'en';
  await loadFoods(ctx.db);
  const r = await recipeByRef(ctx.db, raw.ref, ctx.user.id, locale);
  if (!r) return { ok: false, error: 'not-found' };
  const max = BIG_KITCHENS.has(ctx.from) ? BIG_KITCHEN_SERVINGS : LIMITS.maxServings;
  const servings = Number.isInteger(raw.servings)
    ? Math.min(max, Math.max(1, Number(raw.servings)))
    : r.servings;
  const per = nutritionOf(r.ingredients, r.servings).perPortion;
  return {
    ok: true,
    data: {
      ref: r.ref,
      title: r.title,
      servings,
      baseServings: r.servings,
      minutes: r.prepMin + r.cookMin,
      ingredients: r.ingredients.map((i) => {
        const s = scaledIngredient(i, r.servings, servings);
        return {
          name: s.name,
          qty: s.qty,
          unit: s.unit,
          foodId: s.foodId,
          baseQty: i.qty,
          scaling: i.scaling,
        };
      }),
      perPortion: Object.fromEntries(NUTRIENTS.map((k) => [k, Math.round(per[k] * 10) / 10])),
      allergens: allergensOf(r.ingredients, r.declaredAllergens),
      visibility: r.library
        ? 'library'
        : r.isPublic
          ? 'public'
          : r.shareCode
            ? 'shared'
            : 'private',
    },
  };
};

export default handler;
