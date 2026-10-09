import { HttpError } from './http';
import { foodById, isAllergen, type Allergen } from './foods';
import {
  LIMITS,
  defaultScaling,
  isDifficulty,
  isScaling,
  isStage,
  isTag,
  isUnit,
  type Difficulty,
  type Ingredient,
  type Step,
  type Tag,
} from './recipe';

/**
 * Checks request bodies. Errors are HttpError(400, key, params): `key` is errors.<key> in the
 * translations, a `field` param names fields.<field> (ADR 0011).
 */

export type Body = Record<string, unknown>;

export async function readBody(request: Request): Promise<Body> {
  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'invalidRequest');
  }
  return data as Body;
}

const bad = (key: string, params?: Record<string, string | number>) =>
  new HttpError(400, key, params);

export function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw bad('mustBeText', { field });
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length > max) throw bad('tooLong', { field, max });
  return text;
}

export function requiredText(value: unknown, field: string, max: number): string {
  const text = optionalText(value, field, max);
  if (!text) throw bad('required', { field });
  return text;
}

/** Multi-line text: line breaks kept (at most two empty lines in a row); null when empty. */
export function longOptionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw bad('mustBeText', { field });
  const text = value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  if (!text) return null;
  if (text.length > max) throw bad('tooLong', { field, max });
  return text;
}

export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

export function wholeNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
  fallback?: number,
): number {
  if ((value === undefined || value === null || value === '') && fallback !== undefined)
    return fallback;
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < min || n > max) throw bad('range', { field, min, max });
  return n;
}

/** A quantity as people type it ("1,5", "½", "1/2"), or null when empty. */
export function parseQty(value: unknown): number | null | typeof NaN {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : NaN;
  if (typeof value !== 'string') return NaN;
  const text = value
    .trim()
    .replace(',', '.')
    .replace('½', '.5')
    .replace('¼', '.25')
    .replace('¾', '.75');
  const frac = /^(\d+)?\s*(\d+)\/(\d+)$/.exec(text);
  if (frac) {
    const whole = frac[1] ? Number(frac[1]) : 0;
    const den = Number(frac[3]);
    return den ? whole + Number(frac[2]) / den : NaN;
  }
  return /^\d*\.?\d+$/.test(text) ? Number(text) : NaN;
}

export interface RecipeInput {
  title: string;
  intro: string | null;
  tips: string | null;
  servings: number;
  prepMin: number;
  cookMin: number;
  difficulty: Difficulty;
  cuisine: string | null;
  tags: Tag[];
  allergens: Allergen[];
  equipment: string | null;
  ingredients: Ingredient[];
  steps: Step[];
}

export function recipeInput(body: Body): RecipeInput {
  const difficulty = body.difficulty ?? 'easy';
  if (!isDifficulty(difficulty)) throw bad('invalidRequest');
  const tags = Array.isArray(body.tags) ? [...new Set(body.tags.filter(isTag))] : [];
  const allergens = Array.isArray(body.allergens)
    ? [...new Set(body.allergens.filter(isAllergen))]
    : [];
  if (!Array.isArray(body.ingredients) || !Array.isArray(body.steps)) throw bad('invalidRequest');

  const ingredients: Ingredient[] = [];
  // Empty rows are dropped: a step's `uses` refers to the rows as sent, so map them.
  const position = new Map<number, number>();
  for (const [n, raw] of body.ingredients.entries()) {
    const r = (raw ?? {}) as Body;
    const name = optionalText(r.name, 'ingredientName', LIMITS.ingredientName);
    if (!name) continue;
    const unit = r.unit ?? 'g';
    if (!isUnit(unit)) throw bad('unit', { n: n + 1 });
    const qty = parseQty(r.qty);
    if (Number.isNaN(qty) || (qty !== null && qty > 100000)) throw bad('qty', { n: n + 1 });
    const foodId = typeof r.foodId === 'string' && foodById(r.foodId) ? r.foodId : null;
    const scaling = isScaling(r.scaling) ? r.scaling : defaultScaling(unit, foodById(foodId));
    position.set(n, ingredients.length);
    ingredients.push({
      name,
      qty: unit === 'taste' ? null : qty,
      unit,
      foodId,
      scaling,
      note: optionalText(r.note, 'ingredientNote', LIMITS.ingredientNote),
    });
  }
  if (ingredients.length === 0) throw bad('noIngredients');
  if (ingredients.length > LIMITS.ingredients)
    throw bad('tooManyIngredients', { max: LIMITS.ingredients });

  const steps: Step[] = [];
  for (const raw of body.steps) {
    const r = (raw ?? {}) as Body;
    const text = longOptionalText(r.text, 'step', LIMITS.step);
    if (!text) continue;
    const minutes =
      r.timerMin === undefined || r.timerMin === null || r.timerMin === ''
        ? null
        : Number(r.timerMin);
    if (
      minutes !== null &&
      (!Number.isFinite(minutes) || minutes <= 0 || minutes * 60 > LIMITS.maxTimerSec)
    ) {
      throw bad('timer');
    }
    const uses = Array.isArray(r.uses)
      ? [
          ...new Set(
            r.uses.map((i) => position.get(Number(i))).filter((i): i is number => i !== undefined),
          ),
        ].sort((a, b) => a - b)
      : null;
    steps.push({
      text,
      timerSec: minutes === null ? null : Math.round(minutes * 60),
      stage: isStage(r.stage) ? r.stage : 'cook',
      uses,
    });
  }
  if (steps.length === 0) throw bad('noSteps');
  if (steps.length > LIMITS.steps) throw bad('tooManySteps', { max: LIMITS.steps });

  return {
    title: requiredText(body.title, 'title', LIMITS.title),
    intro: longOptionalText(body.intro, 'intro', LIMITS.intro),
    tips: longOptionalText(body.tips, 'tips', LIMITS.tips),
    servings: wholeNumber(body.servings, 'servings', 1, LIMITS.maxServings),
    prepMin: wholeNumber(body.prepMin, 'prepMin', 0, LIMITS.maxMinutes, 0),
    cookMin: wholeNumber(body.cookMin, 'cookMin', 0, LIMITS.maxMinutes, 0),
    difficulty,
    cuisine: optionalText(body.cuisine, 'cuisine', LIMITS.cuisine),
    tags,
    allergens,
    equipment: longOptionalText(body.equipment, 'equipment', LIMITS.equipment),
    ingredients,
    steps,
  };
}
