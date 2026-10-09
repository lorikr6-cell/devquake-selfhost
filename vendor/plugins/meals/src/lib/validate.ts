import { isIsoDate, type IsoDate } from './dates';
import { HttpError } from './http';
import { LIMITS, PORTIONS, isAllergen, isDiet, isSlot, type Slot } from './plan';
import type { HouseholdSettings, MealChange } from './data';

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

export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

export function wholeNumber(value: unknown, field: string, min: number, max: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < min || n > max) throw bad('range', { field, min, max });
  return n;
}

export function day(value: unknown, field = 'day'): IsoDate {
  if (!isIsoDate(value)) throw bad('date', { field });
  return value;
}

export function slot(value: unknown): Slot {
  if (!isSlot(value)) throw bad('slot');
  return value;
}

export const RECIPE_REF = /^([a-z][a-z0-9-]{1,39}|[1-9]\d{0,9})$/;

export function settingsInput(body: Body): HouseholdSettings {
  const dislikes =
    typeof body.dislikes === 'string' ? body.dislikes.replace(/\r\n?/g, '\n').trim() || null : null;
  if (dislikes && dislikes.length > LIMITS.dislikes)
    throw bad('tooLong', { field: 'dislikes', max: LIMITS.dislikes });
  return {
    name: requiredText(body.name, 'householdName', LIMITS.householdName),
    diet: isDiet(body.diet) ? body.diet : null,
    avoid: Array.isArray(body.avoid) ? [...new Set(body.avoid.filter(isAllergen))] : [],
    dislikes,
    kcalTarget: wholeNumber(body.kcalTarget, 'kcalTarget', 800, 5000),
    proteinTarget: wholeNumber(body.proteinTarget, 'proteinTarget', 10, 300),
  };
}

export function eaterInput(body: Body): { name: string; portion: number } {
  const portion = Number(body.portion);
  if (!PORTIONS.includes(portion as (typeof PORTIONS)[number])) throw bad('portion');
  return { name: requiredText(body.name, 'eaterName', LIMITS.eaterName), portion };
}

export function mealChange(body: Body): MealChange {
  const change: MealChange = {};
  if (body.day !== undefined) change.day = day(body.day);
  if (body.slot !== undefined) change.slot = slot(body.slot);
  if (body.title !== undefined)
    change.title = requiredText(body.title, 'mealTitle', LIMITS.mealTitle);
  if (body.servings !== undefined)
    change.servings = wholeNumber(body.servings, 'servings', 1, LIMITS.maxServings);
  if (body.cooked !== undefined) change.cooked = body.cooked === true;
  if (body.leftovers !== undefined) change.leftovers = body.leftovers === true;
  if (body.note !== undefined) change.note = optionalText(body.note, 'note', LIMITS.note);
  if (body.remind !== undefined) change.remind = optionalText(body.remind, 'remind', LIMITS.remind);
  return change;
}
