import { dishLines } from './meals';
import type { Diet } from './model';

// Dishes copied from Cookbook recipes (migration 0014): scaled to a meal's portions, matched to
// menu lines by name, and the week's ingredients merged for the purchasing list. Pure: tested in
// dishes.test.ts. The scaling follows Cookbook's `recipe.get` contract (its README) without
// importing Cookbook code.

export const SCALINGS = ['linear', 'whole', 'spice', 'fixed'] as const;
export type Scaling = (typeof SCALINGS)[number];
export const isScaling = (v: unknown): v is Scaling => SCALINGS.includes(v as Scaling);

export interface DishIngredient {
  name: string;
  /** For the dish's `baseServings`; null for "to taste". */
  qty: number | null;
  unit: string | null;
  scaling: Scaling;
}

export interface Dish {
  id: number;
  title: string;
  baseServings: number;
  allergens: string[];
  ingredients: DishIngredient[];
}

/** The amount for `servings` of an ingredient written for `base` servings. */
export function scaleQty(
  qty: number | null,
  scaling: Scaling,
  base: number,
  servings: number,
): number | null {
  if (qty === null) return null;
  const f = servings / base;
  switch (scaling) {
    case 'fixed':
      return qty;
    case 'spice':
      return qty * Math.pow(f, 0.75);
    case 'whole':
      return Math.max(1, Math.round(qty * f));
    default:
      return qty * f;
  }
}

/** Rounded for the kitchen: grams and ml to 5 above 100, kilos to 50 g, spoons to quarters. */
export function roundQty(qty: number, unit: string | null): number {
  const to = (step: number) => Math.round(qty / step) * step;
  switch (unit) {
    case 'g':
    case 'ml':
      return qty >= 100 ? to(5) : qty >= 10 ? to(1) : Math.max(to(0.5), 0.5);
    case 'kg':
    case 'l':
      return Math.max(to(0.05), 0.05);
    case 'tsp':
    case 'tbsp':
    case 'cup':
      return Math.max(to(0.25), 0.25);
    case 'pinch':
    case 'pcs':
    case 'clove':
    case 'slice':
    case 'can':
      return Math.max(to(0.5), 0.5);
    default:
      return Math.round(qty * 100) / 100;
  }
}

/** A dish's ingredients for `portions`. */
export function scaledDish(dish: Dish, portions: number): DishIngredient[] {
  return dish.ingredients.map((i) => {
    const qty = scaleQty(i.qty, i.scaling, dish.baseServings, portions);
    return { ...i, qty: qty === null ? null : roundQty(qty, i.unit) };
  });
}

const key = (s: string) => s.trim().toLocaleLowerCase();

/** The dish a menu line names (same text, any case), if any. */
export function dishFor(line: string, dishes: readonly Dish[]): Dish | undefined {
  const k = key(line);
  return dishes.find((d) => key(d.title) === k);
}

/** One meal of one day: its dish lines, the diet variants, and the portions per diet. */
export interface MealToCook {
  dishes: string;
  variants: Partial<Record<Diet, string>>;
  portions: Partial<Record<Diet, number>>;
}

/**
 * Which lines are cooked how many times: a diet with its own variant eats the variant's lines,
 * every other diet the menu's lines.
 */
export function linesToCook(meal: MealToCook): { line: string; portions: number }[] {
  const out = new Map<string, number>();
  const add = (text: string, n: number) => {
    for (const line of dishLines(text)) out.set(line, (out.get(line) ?? 0) + n);
  };
  let plain = 0;
  for (const [diet, n] of Object.entries(meal.portions) as [Diet, number][]) {
    if (!n) continue;
    const variant = diet !== 'normal' ? meal.variants[diet] : undefined;
    if (variant && variant.trim()) add(variant, n);
    else plain += n;
  }
  if (plain) add(meal.dishes, plain);
  return [...out].map(([line, portions]) => ({ line, portions }));
}

export interface ShoppingItem {
  name: string;
  quantity: number | null;
  unit: string | null;
}

/**
 * Everything the dishes of these meals need, merged by name and unit (amounts added, rounded at
 * the end), sorted by name. Lines that are not dishes are left out (nothing to buy from them).
 */
export function ingredientsFor(
  meals: readonly MealToCook[],
  dishes: readonly Dish[],
): ShoppingItem[] {
  const merged = new Map<string, ShoppingItem>();
  for (const meal of meals) {
    for (const { line, portions } of linesToCook(meal)) {
      const dish = dishFor(line, dishes);
      if (!dish) continue;
      for (const i of dish.ingredients) {
        const qty = scaleQty(i.qty, i.scaling, dish.baseServings, portions);
        const k = `${key(i.name)}|${i.unit ?? ''}`;
        const known = merged.get(k);
        if (known) {
          known.quantity =
            known.quantity === null || qty === null
              ? (known.quantity ?? qty)
              : known.quantity + qty;
        } else {
          merged.set(k, { name: i.name.trim(), quantity: qty, unit: i.unit });
        }
      }
    }
  }
  return [...merged.values()]
    .map((i) => ({ ...i, quantity: i.quantity === null ? null : roundQty(i.quantity, i.unit) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** In groups of at most `size` (Shopping takes 30 items per call). */
export function inBatches<T>(items: readonly T[], size = 30): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** A stable text of the items, hashed by the caller to notice the same week sent twice. */
export const itemsText = (items: readonly ShoppingItem[]) =>
  items.map((i) => `${key(i.name)}|${i.quantity ?? ''}|${i.unit ?? ''}`).join('\n');
