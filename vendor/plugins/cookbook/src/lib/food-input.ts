import { LOCALES } from '@devquake/ui';
import { isFoodIcon, isHexColour, type FoodIcon } from './food-icons';
import {
  ALLERGENS,
  FOOD_KINDS,
  NUTRIENTS,
  ORIGINS,
  WEIGHED_UNITS,
  isAllergen,
  type Food,
  type FoodKind,
  type Nutrients,
  type Origin,
} from './foods';
import { HttpError } from './http';

// What staff may save in the food catalogue (/admin/foods). Pure and tested; errors are keys of
// errors.* (lib/http.ts), shown in the staff member's language.

export const FOOD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const FOOD_ID_MAX = 40;
export const FOOD_NAME_MAX = 80;

/** Upper limits per 100 g (energy: pure fat is about 900 kcal; salt: baking soda is ~68 g). */
const NUTRIENT_MAX: Record<keyof Nutrients, number> = {
  kcal: 950,
  protein: 100,
  carbs: 100,
  fat: 100,
  fibre: 100,
  salt: 100,
};
const GRAMS_MAX = 5000;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const x = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : NaN;
};

/** The id of a new food (a short slug, like "red-onion"). */
export function foodIdInput(v: unknown): string {
  const id = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (id.length < 2 || id.length > FOOD_ID_MAX || !FOOD_ID.test(id)) {
    throw new HttpError(400, 'foodId');
  }
  return id;
}

/** A food from the editor's JSON body; `id` comes from the URL or foodIdInput. */
export function foodInput(id: string, body: Record<string, unknown>): Food {
  const names = (body.name ?? {}) as Record<string, unknown>;
  const name = {} as Food['name'];
  for (const l of LOCALES) {
    const v = typeof names[l] === 'string' ? (names[l] as string).trim().replace(/\s+/g, ' ') : '';
    if (!v || v.length > FOOD_NAME_MAX) throw new HttpError(400, 'foodName');
    name[l] = v;
  }

  const kind = body.kind as FoodKind;
  if (!(FOOD_KINDS as readonly string[]).includes(kind) || !isFoodIcon(body.icon)) {
    throw new HttpError(400, 'foodKind');
  }
  const icon = body.icon as FoodIcon;
  const colourRaw = typeof body.colour === 'string' ? body.colour.trim().toLowerCase() : '';
  if (colourRaw && !isHexColour(colourRaw)) throw new HttpError(400, 'foodKind');

  const per = (body.per100 ?? {}) as Record<string, unknown>;
  const per100 = {} as Nutrients;
  for (const k of NUTRIENTS) {
    const v = num(per[k]);
    if (v === null || Number.isNaN(v) || v < 0 || v > NUTRIENT_MAX[k]) {
      throw new HttpError(400, 'foodNutrients');
    }
    per100[k] = Math.round(v * 100) / 100;
  }
  if (per100.protein + per100.carbs + per100.fat > 101) throw new HttpError(400, 'foodNutrients');

  const gramsIn = (body.grams ?? {}) as Record<string, unknown>;
  const grams: NonNullable<Food['grams']> = {};
  for (const u of WEIGHED_UNITS) {
    const v = num(gramsIn[u]);
    if (v === null) continue;
    if (Number.isNaN(v) || v <= 0 || v > GRAMS_MAX) throw new HttpError(400, 'foodWeights');
    grams[u] = Math.round(v * 100) / 100;
  }
  const density = num(body.density);
  if (density !== null && (Number.isNaN(density) || density < 0.3 || density > 2)) {
    throw new HttpError(400, 'foodWeights');
  }

  const origin = body.origin as Origin;
  if (!(ORIGINS as readonly string[]).includes(origin)) throw new HttpError(400, 'foodOrigin');
  const allergens = Array.isArray(body.allergens) ? body.allergens.filter(isAllergen) : [];

  const food: Food = { id, name, kind, icon, per100, origin };
  if (colourRaw) food.colour = colourRaw;
  if (Object.keys(grams).length) food.grams = grams;
  if (density !== null) food.density = density;
  if (allergens.length) food.allergens = ALLERGENS.filter((a) => allergens.includes(a));
  if (body.spice === true) food.spice = true;
  if (body.active === false) food.active = false;
  return food;
}
