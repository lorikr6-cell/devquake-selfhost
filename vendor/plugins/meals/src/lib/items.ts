import type { PluginLinksApi } from '@devquake/plugin-sdk';
import { getRecipe } from './cookbook';
import type { MealItem } from './data';
import { HttpError } from './http';
import { LIMITS } from './plan';
import { RECIPE_REF, optionalText } from './validate';

/** A recipe part: the cookbook's title and nutrition per portion, copied now. */
export async function recipeItem(
  links: PluginLinksApi | undefined,
  ref: string,
  servings: number,
): Promise<MealItem> {
  if (!RECIPE_REF.test(ref)) throw new HttpError(404, 'recipeNotFound');
  const recipe = await getRecipe(links, ref, servings);
  if (!recipe) throw new HttpError(502, 'cookbookFailed');
  return {
    recipeRef: ref,
    name: recipe.title.slice(0, LIMITS.itemName),
    qty: null,
    unit: null,
    kcal: recipe.perPortion?.kcal ?? null,
    protein: recipe.perPortion?.protein ?? null,
    carbs: recipe.perPortion?.carbs ?? null,
    fat: recipe.perPortion?.fat ?? null,
  };
}

const UNIT = /^[\p{L}.]{1,16}$/u;

/** Parts sent by the page: `{ recipeRef }` for a cookbook recipe, `{ name, qty?, unit? }` for an item. */
export async function readItems(
  raw: unknown,
  links: PluginLinksApi | undefined,
  servings: number,
): Promise<MealItem[]> {
  if (!Array.isArray(raw)) return [];
  if (raw.length > LIMITS.itemsPerMeal)
    throw new HttpError(400, 'tooManyItems', { max: LIMITS.itemsPerMeal });
  const out: MealItem[] = [];
  for (const entry of raw) {
    const e = (entry ?? {}) as Record<string, unknown>;
    if (typeof e.recipeRef === 'string' && e.recipeRef) {
      out.push(await recipeItem(links, e.recipeRef, servings));
      continue;
    }
    const name = optionalText(e.name, 'itemName', LIMITS.itemName);
    if (!name) continue;
    const qtyText =
      typeof e.qty === 'number'
        ? String(e.qty)
        : typeof e.qty === 'string'
          ? e.qty.trim().replace(',', '.')
          : '';
    const qty = qtyText === '' ? null : Number(qtyText);
    if (qty !== null && (!Number.isFinite(qty) || qty <= 0 || qty > 99999))
      throw new HttpError(400, 'qty');
    const unit = typeof e.unit === 'string' && e.unit.trim() ? e.unit.trim() : null;
    if (unit && !UNIT.test(unit)) throw new HttpError(400, 'unit');
    out.push({
      recipeRef: null,
      name,
      qty,
      unit,
      kcal: null,
      protein: null,
      carbs: null,
      fat: null,
    });
  }
  return out;
}
