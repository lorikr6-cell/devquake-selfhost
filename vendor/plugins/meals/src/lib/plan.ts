// Meal planning rules: slots, servings from the eaters, suggesting a week, merging a week's
// ingredients into one shopping list, nutrition per day and evening-before reminders. Pure:
// shared by pages, the API, the scheduled hook and tests.

import { addDays, mondayOf, type IsoDate } from './dates';

export const SLOTS = [
  { code: 'breakfast', icon: '🥐' },
  { code: 'lunch', icon: '🥗' },
  { code: 'dinner', icon: '🍲' },
  { code: 'snack', icon: '🍎' },
] as const;
export type Slot = (typeof SLOTS)[number]['code'];
export const isSlot = (v: unknown): v is Slot => SLOTS.some((s) => s.code === v);
export const slotIcon = (code: string) => SLOTS.find((s) => s.code === code)?.icon ?? '🍽️';

/** The cookbook's diet tags (its public link contract), offered as the household's diet. */
export const DIETS = [
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
] as const;
export type Diet = (typeof DIETS)[number];
export const isDiet = (v: unknown): v is Diet => DIETS.includes(v as Diet);

/** The 14 EU allergens, as the cookbook names them. */
export const ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const;
export type Allergen = (typeof ALLERGENS)[number];
export const isAllergen = (v: unknown): v is Allergen => ALLERGENS.includes(v as Allergen);

export const PORTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;

export const LIMITS = {
  householdName: 60,
  eaterName: 60,
  mealTitle: 100,
  note: 200,
  remind: 160,
  dislikes: 500,
  eaters: 20,
  members: 20,
  households: 10,
  mealsPerDay: 12,
  maxServings: 50,
  itemsPerMeal: 10,
  itemName: 100,
  setsPerUser: 200,
  description: 1000,
  comment: 1000,
  commentsPerHour: 20,
} as const;

/** The seven days of the week that starts on `monday`. */
export const weekDays = (monday: IsoDate): IsoDate[] =>
  Array.from({ length: 7 }, (_, i) => addDays(monday, i));

/** The Monday of a `?week=` value, or of today's week. */
export function weekStart(value: unknown, today: IsoDate): IsoDate {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? mondayOf(value)
    : mondayOf(today);
}

/** Servings for the household: the eaters' portions added up, rounded up (at least 1). */
export function householdServings(portions: number[]): number {
  const total = portions.reduce((n, p) => n + p, 0);
  return Math.max(1, Math.ceil(total - 1e-9));
}

// --- Suggestions

export interface Candidate {
  ref: string;
  title: string;
  tags: string[];
  allergens: string[];
}

export interface PlannedSlot {
  day: IsoDate;
  slot: Slot;
}

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** The words of the dislikes text (one per line or comma-separated). */
export function dislikeWords(text: string | null): string[] {
  return (text ?? '')
    .split(/[\n,;]+/)
    .map((w) => fold(w.trim()))
    .filter((w) => w.length >= 3);
}

/** A small, repeatable shuffle (the same week and household give the same suggestion). */
function shuffled<T>(list: T[], seed: number): T[] {
  const out = [...list];
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Recipes for the empty slots: breakfast recipes for breakfasts, the others for lunch and
 * dinner; none with an allergen to avoid or a disliked word in the title; no recipe twice in the
 * week (also not one already planned) while there are others left.
 */
export function suggestWeek(args: {
  candidates: Candidate[];
  empty: PlannedSlot[];
  planned: string[];
  avoid: string[];
  dislikes: string[];
  seed: number;
}): (PlannedSlot & { ref: string; title: string })[] {
  const ok = args.candidates.filter(
    (c) =>
      !c.allergens.some((a) => args.avoid.includes(a)) &&
      !args.dislikes.some((w) => fold(c.title).includes(w)),
  );
  const pools = {
    breakfast: shuffled(
      ok.filter((c) => c.tags.includes('breakfast')),
      args.seed,
    ),
    main: shuffled(
      ok.filter((c) => !c.tags.includes('breakfast')),
      args.seed + 1,
    ),
  };
  const used = new Set(args.planned);
  const out: (PlannedSlot & { ref: string; title: string })[] = [];
  for (const slot of args.empty) {
    if (slot.slot === 'snack') continue;
    const pool = slot.slot === 'breakfast' ? pools.breakfast : pools.main;
    if (pool.length === 0) continue;
    const pick = pool.find((c) => !used.has(c.ref)) ?? pool[out.length % pool.length]!;
    used.add(pick.ref);
    out.push({ ...slot, ref: pick.ref, title: pick.title });
  }
  return out;
}

// --- Shopping list

export interface ListItem {
  name: string;
  qty: number | null;
  unit: string;
}

/** Rounds a merged quantity for shopping: grams and ml to 5 above 100, others to quarters. */
export function shopQty(qty: number, unit: string): number {
  if (unit === 'g' || unit === 'ml') return qty >= 100 ? Math.ceil(qty / 5) * 5 : Math.ceil(qty);
  return Math.ceil(qty * 4) / 4;
}

/**
 * The week's ingredients as one list: the same name and unit added up (names compared without
 * case and accents), weights over 1000 g as kg and volumes over 1000 ml as l; "to taste" and
 * quantity-less items once each.
 */
export function mergeItems(items: ListItem[]): ListItem[] {
  const map = new Map<string, ListItem>();
  for (const i of items) {
    const unit = i.unit === 'kg' ? 'g' : i.unit === 'l' ? 'ml' : i.unit;
    const qty = i.qty === null ? null : i.unit === 'kg' || i.unit === 'l' ? i.qty * 1000 : i.qty;
    const key = `${fold(i.name.trim())}|${qty === null ? '-' : unit}`;
    const seen = map.get(key);
    if (!seen) map.set(key, { name: i.name.trim(), qty, unit });
    else if (seen.qty !== null && qty !== null) seen.qty += qty;
  }
  return [...map.values()]
    .map((i) => {
      if (i.qty === null) return i;
      if (i.unit === 'g' && i.qty >= 1000)
        return { ...i, qty: Math.ceil((i.qty / 1000) * 20) / 20, unit: 'kg' };
      if (i.unit === 'ml' && i.qty >= 1000)
        return { ...i, qty: Math.ceil((i.qty / 1000) * 20) / 20, unit: 'l' };
      return { ...i, qty: shopQty(i.qty, i.unit) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// --- Nutrition per day

export interface MealNutrition {
  kcal: number | null;
  protein: number | null;
}

/**
 * One person's portion of a meal: the recipe parts' nutrition per portion added up; null when
 * a recipe part has none or the meal has no recipe part (items typed in carry no nutrition).
 */
export function mealNutrition(
  items: { recipeRef: string | null; kcal: number | null; protein: number | null }[],
): MealNutrition {
  const recipes = items.filter((i) => i.recipeRef);
  if (recipes.length === 0 || recipes.some((i) => i.kcal === null))
    return { kcal: null, protein: null };
  return {
    kcal: recipes.reduce((n, i) => n + (i.kcal ?? 0), 0),
    protein: recipes.reduce((n, i) => n + (i.protein ?? 0), 0),
  };
}

/** A meal's title from its parts: the first recipe's, or the parts' names joined. */
export function titleFromItems(
  items: { recipeRef: string | null; name: string }[],
  max = 100,
): string {
  const recipe = items.find((i) => i.recipeRef);
  const title = recipe ? recipe.name : items.map((i) => i.name).join(', ');
  return title.slice(0, max);
}

/** One person's day: a portion of every meal; `known` says whether every meal had nutrition. */
export function dayTotals(meals: MealNutrition[]): {
  kcal: number;
  protein: number;
  known: boolean;
} {
  let kcal = 0;
  let protein = 0;
  let known = meals.length > 0;
  for (const m of meals) {
    if (m.kcal === null) known = false;
    kcal += m.kcal ?? 0;
    protein += m.protein ?? 0;
  }
  return { kcal: Math.round(kcal), protein: Math.round(protein), known };
}

// --- Reminders

/** Evening-before reminders go out from this local hour on. */
export const REMIND_HOUR = 18;

/**
 * Whether a meal's reminder is due at `localNow` ("YYYY-MM-DDTHH:mm" in the household's zone):
 * from 18:00 the evening before until the meal's day ends.
 */
export function reminderDue(mealDay: IsoDate, localNow: string): boolean {
  const today = localNow.slice(0, 10);
  const hour = Number(localNow.slice(11, 13));
  if (today === mealDay) return true;
  return today === addDays(mealDay, -1) && hour >= REMIND_HOUR;
}

/** A household's seed for a week's suggestions. */
export const weekSeed = (householdId: number, monday: IsoDate) =>
  householdId * 7919 + (Number(monday.replace(/-/g, '')) % 100000);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

export function newInviteCode(random: (max: number) => number): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}
