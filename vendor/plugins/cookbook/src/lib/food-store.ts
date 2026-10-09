import type { PluginDatabase } from '@devquake/plugin-sdk';
import { isFoodIcon, type FoodIcon } from './food-icons';
import {
  ALLERGENS,
  FOODS,
  FOOD_KINDS,
  ORIGINS,
  WEIGHED_UNITS,
  isAllergen,
  setFoodCatalogue,
  type Food,
  type FoodKind,
  type Origin,
} from './foods';

// The food catalogue in the app's database (table `foods`, migration 0003). The built-in foods
// (lib/foods.ts) are added to it once (missing ids only, so edits made by staff stay); from
// then on the table is the source. Pages and the API call loadFoods() before using the recipe
// maths; the catalogue is kept for a minute per process.

const KEEP_MS = 60_000;
let loadedAt = 0;
let loading: Promise<void> | null = null;

export interface FoodRow {
  id: string;
  kind: string;
  icon: string;
  colour: string | null;
  name_en: string;
  name_de: string;
  name_ro: string;
  name_hu: string;
  kcal: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  fibre: number | string;
  salt: number | string;
  grams: string | null;
  density: number | string | null;
  allergens: string | null;
  origin: string;
  is_spice: number | string;
  is_active: number | string;
  /** The picture shown to everyone (migration 0004); absent in older rows. */
  photo_id?: number | string | null;
}

/** The table's columns, in the order of rowValues(). */
export const FOOD_COLUMNS = [
  'id',
  'kind',
  'icon',
  'colour',
  'name_en',
  'name_de',
  'name_ro',
  'name_hu',
  'kcal',
  'protein',
  'carbs',
  'fat',
  'fibre',
  'salt',
  'grams',
  'density',
  'allergens',
  'origin',
  'is_spice',
  'is_active',
] as const;
const COLUMNS = FOOD_COLUMNS.join(', ');
/** Read with the chosen picture (written separately: lib/food-photos.ts). */
const READ_COLUMNS = `${COLUMNS}, photo_id`;

/** A database row as a food; null when it is not usable (unknown kind, icon or origin). */
export function foodFromRow(r: FoodRow): Food | null {
  if (!(FOOD_KINDS as readonly string[]).includes(r.kind)) return null;
  if (!isFoodIcon(r.icon)) return null;
  if (!(ORIGINS as readonly string[]).includes(r.origin)) return null;
  let grams: Food['grams'];
  try {
    const parsed = r.grams ? (JSON.parse(r.grams) as Record<string, unknown>) : {};
    const clean: NonNullable<Food['grams']> = {};
    for (const u of WEIGHED_UNITS) {
      const v = Number(parsed[u]);
      if (parsed[u] !== undefined && Number.isFinite(v) && v > 0) clean[u] = v;
    }
    grams = Object.keys(clean).length ? clean : undefined;
  } catch {
    grams = undefined;
  }
  const allergens = (r.allergens ?? '').split(',').filter(isAllergen);
  const food: Food = {
    id: r.id,
    kind: r.kind as FoodKind,
    icon: r.icon as FoodIcon,
    name: { en: r.name_en, de: r.name_de, ro: r.name_ro, hu: r.name_hu },
    per100: {
      kcal: Number(r.kcal),
      protein: Number(r.protein),
      carbs: Number(r.carbs),
      fat: Number(r.fat),
      fibre: Number(r.fibre),
      salt: Number(r.salt),
    },
    origin: r.origin as Origin,
  };
  if (r.colour) food.colour = r.colour;
  if (grams) food.grams = grams;
  if (r.density !== null && Number(r.density) > 0) food.density = Number(r.density);
  if (allergens.length) food.allergens = ALLERGENS.filter((a) => allergens.includes(a));
  if (Number(r.is_spice) === 1) food.spice = true;
  if (Number(r.is_active) !== 1) food.active = false;
  if (r.photo_id !== undefined && r.photo_id !== null) food.photo = Number(r.photo_id);
  return food;
}

/** A food as the values of the columns (in COLUMNS order). */
export function rowValues(f: Food): unknown[] {
  return [
    f.id,
    f.kind,
    f.icon,
    f.colour ?? null,
    f.name.en,
    f.name.de,
    f.name.ro,
    f.name.hu,
    f.per100.kcal,
    f.per100.protein,
    f.per100.carbs,
    f.per100.fat,
    f.per100.fibre,
    f.per100.salt,
    f.grams && Object.keys(f.grams).length ? JSON.stringify(f.grams) : null,
    f.density ?? null,
    f.allergens?.length ? f.allergens.join(',') : null,
    f.origin,
    f.spice ? 1 : 0,
    f.active === false ? 0 : 1,
  ];
}

const MARKS = FOOD_COLUMNS.map(() => '?').join(', ');

/**
 * Loads the catalogue from the database into lib/foods.ts (at most once a minute, or right
 * away with `fresh`). Adds the built-in foods the table does not have yet. Without the database
 * (or when it fails) the built-in foods stay in use.
 */
export async function loadFoods(db: PluginDatabase | null | undefined, fresh = false) {
  if (!db) return;
  if (!fresh && Date.now() - loadedAt < KEEP_MS) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      // Without migration 0004 there is no photo_id yet: read the rest.
      const read = () =>
        db
          .query<FoodRow>(`SELECT ${READ_COLUMNS} FROM foods`)
          .catch(() => db.query<FoodRow>(`SELECT ${COLUMNS} FROM foods`));
      let rows = await read();
      const have = new Set(rows.map((r) => r.id));
      const missing = FOODS.filter((f) => !have.has(f.id));
      if (missing.length > 0) {
        for (const f of missing) {
          await db.execute(`INSERT IGNORE INTO foods (${COLUMNS}) VALUES (${MARKS})`, rowValues(f));
        }
        rows = await read();
      }
      setFoodCatalogue(rows.flatMap((r) => foodFromRow(r) ?? []));
      loadedAt = Date.now();
    } catch {
      // Table not there yet (migration 0003) or the database is busy: keep what we have.
      loadedAt = Date.now() - KEEP_MS + 10_000;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Whether a food with this id is in the table. */
export async function foodExists(db: PluginDatabase, id: string): Promise<boolean> {
  const rows = await db.query<{ id: string }>('SELECT id FROM foods WHERE id = ?', [id]);
  return rows.length > 0;
}

/** Adds a food (staff). */
export async function insertFood(db: PluginDatabase, food: Food): Promise<void> {
  await db.execute(`INSERT INTO foods (${COLUMNS}) VALUES (${MARKS})`, rowValues(food));
  await loadFoods(db, true);
}

/** Changes a food (staff); the id stays. */
export async function updateFood(db: PluginDatabase, food: Food): Promise<void> {
  const [, ...values] = rowValues(food);
  await db.execute(
    `UPDATE foods
        SET kind = ?, icon = ?, colour = ?, name_en = ?, name_de = ?, name_ro = ?, name_hu = ?,
            kcal = ?, protein = ?, carbs = ?, fat = ?, fibre = ?, salt = ?, grams = ?,
            density = ?, allergens = ?, origin = ?, is_spice = ?, is_active = ?
      WHERE id = ?`,
    [...values, food.id],
  );
  await loadFoods(db, true);
}
