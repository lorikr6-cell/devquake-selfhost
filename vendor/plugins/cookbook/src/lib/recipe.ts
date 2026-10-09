// Recipes: units, scaling for any number of servings (with sensible rounding), metric or
// imperial display, nutrition per portion, diet tags with the reason they fit, and allergens.
// Pure: shared by pages, the API, link points and tests.

import { ALLERGENS, NUTRIENTS, foodById, type Allergen, type Food, type Nutrients } from './foods';

export const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'pcs',
  'tsp',
  'tbsp',
  'cup',
  'clove',
  'pinch',
  'slice',
  'can',
  'taste',
] as const;
export type Unit = (typeof UNITS)[number];
export const isUnit = (v: unknown): v is Unit => UNITS.includes(v as Unit);

/**
 * How an ingredient follows the servings: linear (most), whole (eggs, pieces: never half an
 * egg), spice (salt and spices grow less: the factor to the power 0.75), fixed (one bay leaf,
 * oil for the pan).
 */
export const SCALINGS = ['linear', 'whole', 'spice', 'fixed'] as const;
export type Scaling = (typeof SCALINGS)[number];
export const isScaling = (v: unknown): v is Scaling => SCALINGS.includes(v as Scaling);

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const isDifficulty = (v: unknown): v is Difficulty => DIFFICULTIES.includes(v as Difficulty);

/**
 * Diet tags. Declared by the author (eating patterns and diets); `high-protein`, `lower-carb` and
 * `quick` are also worked out from the nutrition and the time (with the reason shown).
 */
export const TAGS = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'gluten-free',
  'lactose-free',
  'mediterranean',
  'dash',
  'high-protein',
  'lower-carb',
  'quick',
  'budget',
  'breakfast',
] as const;
export type Tag = (typeof TAGS)[number];
export const isTag = (v: unknown): v is Tag => TAGS.includes(v as Tag);

export const LIMITS = {
  title: 100,
  equipment: 500,
  intro: 1000,
  tips: 1000,
  cuisine: 40,
  ingredientName: 80,
  ingredientNote: 80,
  step: 1000,
  ingredients: 40,
  steps: 30,
  maxServings: 50,
  maxMinutes: 2880,
  maxTimerSec: 86400,
  recipesPerUser: 500,
  comment: 1000,
  commentsPerHour: 20,
} as const;

/** High protein: at least this much protein per portion (g). */
export const HIGH_PROTEIN_G = 25;
/** Lower carb: at most this much carbohydrate per portion (g). */
export const LOWER_CARB_G = 20;
/** Quick: ready in at most this many minutes. */
export const QUICK_MIN = 30;

export interface Ingredient {
  name: string;
  qty: number | null;
  unit: Unit;
  /** The food it is (lib/foods.ts), for nutrition, allergens and diet checks; null = unknown. */
  foodId: string | null;
  scaling: Scaling;
  note: string | null;
}

/** A step's part of the work: getting ready, cooking, serving (the view groups steps by it). */
export const STAGES = ['prepare', 'cook', 'serve'] as const;
export type Stage = (typeof STAGES)[number];
export const isStage = (v: unknown): v is Stage => STAGES.includes(v as Stage);

export interface Step {
  text: string;
  timerSec: number | null;
  stage: Stage;
  /** Positions of the ingredients the step uses; null = worked out from the text (lib/guide.ts). */
  uses: number[] | null;
}

/** The scaling an ingredient gets by default from its unit and food. */
export function defaultScaling(unit: Unit, food: Food | undefined): Scaling {
  if (unit === 'taste') return 'fixed';
  if (food?.spice || unit === 'pinch') return 'spice';
  if (unit === 'pcs' || unit === 'clove' || unit === 'can' || unit === 'slice') return 'whole';
  return 'linear';
}

/** The quantity for `servings` of a recipe written for `base` servings. */
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

/** Rounds for the kitchen: grams and ml to 5 above 100, spoons to quarters, pieces to halves. */
export function roundQty(qty: number, unit: Unit): number {
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
      return qty;
  }
}

/** Shown units: metric as written, or imperial (oz, lb, fl oz, quarts) for weights and volumes. */
export type DisplayUnit = Unit | 'oz' | 'lb' | 'floz' | 'qt';

export function toImperial(qty: number, unit: Unit): { qty: number; unit: DisplayUnit } {
  switch (unit) {
    case 'g':
      return qty >= 454
        ? { qty: Math.round((qty / 453.6) * 4) / 4, unit: 'lb' }
        : { qty: Math.round((qty / 28.35) * 4) / 4 || 0.25, unit: 'oz' };
    case 'kg':
      return { qty: Math.round(qty * 2.2046 * 4) / 4, unit: 'lb' };
    case 'ml':
      return qty >= 946
        ? { qty: Math.round((qty / 946) * 4) / 4, unit: 'qt' }
        : { qty: Math.round((qty / 29.57) * 4) / 4 || 0.25, unit: 'floz' };
    case 'l':
      return { qty: Math.round((qty / 0.946) * 4) / 4, unit: 'qt' };
    default:
      return { qty, unit };
  }
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/** "1½", "250", "0.35" in the page language's number style. */
export function formatQty(qty: number, tag: string): string {
  const whole = Math.floor(qty);
  const rest = Math.round((qty - whole) * 100) / 100;
  const frac = FRACTIONS[String(rest)];
  if (frac) return `${whole || ''}${frac}`;
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 2 }).format(qty);
}

/** The ingredient's weight in grams, or null when it cannot be weighed. */
export function gramsOf(qty: number | null, unit: Unit, food: Food | undefined): number | null {
  if (qty === null || !food) return null;
  switch (unit) {
    case 'g':
      return qty;
    case 'kg':
      return qty * 1000;
    case 'ml':
      return qty * (food.density ?? 1);
    case 'l':
      return qty * 1000 * (food.density ?? 1);
    case 'taste':
      return null;
    default: {
      const per = food.grams?.[unit];
      return per === undefined ? null : qty * per;
    }
  }
}

export interface Nutrition {
  /** Per portion. */
  perPortion: Nutrients;
  /** Ingredients that count (weighed and known) of all with a quantity. */
  counted: number;
  total: number;
}

const zero = (): Nutrients => ({ kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, salt: 0 });

/** Nutrition per portion from the ingredients' foods (unknown or unweighable ones are left out). */
export function nutritionOf(ingredients: Ingredient[], servings: number): Nutrition {
  const sum = zero();
  let counted = 0;
  let total = 0;
  for (const i of ingredients) {
    if (i.qty === null || i.unit === 'taste') continue;
    total++;
    const food = foodById(i.foodId);
    const grams = gramsOf(i.qty, i.unit, food);
    if (grams === null || !food) continue;
    counted++;
    for (const k of NUTRIENTS) sum[k] += (food.per100[k] * grams) / 100;
  }
  const per = zero();
  for (const k of NUTRIENTS) per[k] = sum[k] / Math.max(1, servings);
  return { perPortion: per, counted, total };
}

/** Allergens of the ingredients' foods, plus the ones the author declared. */
export function allergensOf(ingredients: Ingredient[], declared: Allergen[] = []): Allergen[] {
  const set = new Set<Allergen>(declared);
  for (const i of ingredients) for (const a of foodById(i.foodId)?.allergens ?? []) set.add(a);
  return ALLERGENS.filter((a) => set.has(a));
}

export interface TagCheck {
  tag: Tag;
  /** Why it fits: a key of tagWhy.* with its values, or null when only declared. */
  why: { key: string; values: Record<string, number> } | null;
}

/**
 * The tags a recipe shows: worked out from nutrition and time (high-protein, lower-carb, quick,
 * with the reason), and the declared ones that the known ingredients do not contradict (a
 * "vegetarian" recipe with chicken loses the tag).
 */
export function tagsOf(args: {
  declared: Tag[];
  ingredients: Ingredient[];
  nutrition: Nutrition;
  minutes: number;
}): TagCheck[] {
  const { declared, ingredients, nutrition, minutes } = args;
  const origins = new Set(ingredients.map((i) => foodById(i.foodId)?.origin).filter(Boolean));
  const allergens = new Set(allergensOf(ingredients));
  const contradicts = (tag: Tag): boolean => {
    switch (tag) {
      case 'vegetarian':
        return origins.has('meat') || origins.has('fish');
      case 'vegan':
        return ['meat', 'fish', 'dairy', 'egg', 'honey'].some((o) => origins.has(o as never));
      case 'pescatarian':
        return origins.has('meat');
      case 'gluten-free':
        return allergens.has('gluten');
      case 'lactose-free':
        return allergens.has('milk');
      default:
        return false;
    }
  };
  const out: TagCheck[] = [];
  const known = nutrition.total > 0 && nutrition.counted === nutrition.total;
  const p = nutrition.perPortion;
  if (known && p.protein >= HIGH_PROTEIN_G) {
    out.push({
      tag: 'high-protein',
      why: { key: 'highProtein', values: { g: Math.round(p.protein), min: HIGH_PROTEIN_G } },
    });
  }
  if (known && p.carbs <= LOWER_CARB_G) {
    out.push({
      tag: 'lower-carb',
      why: { key: 'lowerCarb', values: { g: Math.round(p.carbs), max: LOWER_CARB_G } },
    });
  }
  if (minutes > 0 && minutes <= QUICK_MIN) {
    out.push({ tag: 'quick', why: { key: 'quick', values: { min: minutes } } });
  }
  for (const tag of declared) {
    if (out.some((x) => x.tag === tag)) continue;
    // Nutrition tags are only shown when the numbers back them.
    if (tag === 'high-protein' || tag === 'lower-carb' || tag === 'quick') continue;
    if (!contradicts(tag)) out.push({ tag, why: null });
  }
  return out.sort((a, b) => TAGS.indexOf(a.tag) - TAGS.indexOf(b.tag));
}

/** One ingredient scaled and rounded for `servings`, as shown and as sent to a shopping list. */
export function scaledIngredient(i: Ingredient, base: number, servings: number): Ingredient {
  const qty = scaleQty(i.qty, i.scaling, base, servings);
  return { ...i, qty: qty === null ? null : roundQty(qty, i.unit) };
}
