import type { PluginDatabase } from '@devquake/plugin-sdk';
import { requireCan } from './data';
import { addDays, type IsoDate } from './dates';
import { HttpError } from './http';
import {
  DELIVERY_MEAL,
  MAX_DISHES_LENGTH,
  MAX_MEAL_TIMES,
  overlaps,
  type Eater,
  type MealTime,
} from './meals';
import { DIETS, type Diet, type PersonKind, type PersonStatus } from './model';

/**
 * Meal planning on the app's own database (docs/plugins/ideas/canteen.md, step 2). Reading
 * menus needs `kitchen.view`, changing them `meals.edit` (lib/roles.ts).
 */

type Db = Omit<PluginDatabase, 'transaction'>;

const num = (v: unknown) => Number(v);

// ---------------------------------------------------------------------------------------------
// Meal times (residents)

export async function listMealTimes(db: Db, orgId: number, userId: number): Promise<MealTime[]> {
  await requireCan(db, orgId, userId, 'kitchen.view');
  return mealTimesOf(db, orgId);
}

async function mealTimesOf(db: Db, orgId: number): Promise<MealTime[]> {
  const rows = await db.query<{ id: number; name: string; starts_min: number; ends_min: number }>(
    'SELECT id, name, starts_min, ends_min FROM canteen_meal_times WHERE org_id = ? ORDER BY starts_min',
    [orgId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    name: r.name,
    startsMin: num(r.starts_min),
    endsMin: num(r.ends_min),
  }));
}

export interface MealTimeInput {
  name: string;
  startsMin: number;
  endsMin: number;
}

/** Adds a meal time, or changes one (`id`). They may not overlap. */
export async function saveMealTime(
  db: Db,
  orgId: number,
  userId: number,
  input: MealTimeInput,
  id?: number,
): Promise<number> {
  await requireCan(db, orgId, userId, 'meals.edit');
  const list = await mealTimesOf(db, orgId);
  if (id !== undefined && !list.some((m) => m.id === id)) throw new HttpError(404, 'notFound');
  if (id === undefined && list.length >= MAX_MEAL_TIMES) {
    throw new HttpError(400, 'tooManyMealTimes', { max: MAX_MEAL_TIMES });
  }
  const clash = overlaps(list, input.startsMin, input.endsMin, id);
  if (clash) throw new HttpError(400, 'mealTimeOverlap', { name: clash.name });
  if (id !== undefined) {
    await db.execute(
      'UPDATE canteen_meal_times SET name = ?, starts_min = ?, ends_min = ? WHERE id = ? AND org_id = ?',
      [input.name, input.startsMin, input.endsMin, id, orgId],
    );
    return id;
  }
  const res = await db.execute(
    'INSERT INTO canteen_meal_times (org_id, name, starts_min, ends_min) VALUES (?, ?, ?, ?)',
    [orgId, input.name, input.startsMin, input.endsMin],
  );
  return res.insertId;
}

/** Removes a meal time with its menus. */
export async function deleteMealTime(db: Db, orgId: number, id: number, userId: number) {
  await requireCan(db, orgId, userId, 'meals.edit');
  await db.execute('DELETE FROM canteen_menus WHERE org_id = ? AND meal_time_id = ?', [orgId, id]);
  await db.execute('DELETE FROM canteen_meal_times WHERE id = ? AND org_id = ?', [id, orgId]);
}

// ---------------------------------------------------------------------------------------------
// Menus

export interface Menu {
  day: IsoDate;
  meal: number;
  dishes: string;
  variants: Partial<Record<Diet, string>>;
}

/** The menus of `days` consecutive days from `from`. */
async function menusOf(db: Db, orgId: number, from: IsoDate, days: number): Promise<Menu[]> {
  const rows = await db.query<{ id: number; day: string; meal_time_id: number; dishes: string }>(
    `SELECT id, DATE_FORMAT(day, '%Y-%m-%d') AS day, meal_time_id, dishes FROM canteen_menus
      WHERE org_id = ? AND day >= ? AND day < ?`,
    [orgId, from, addDays(from, days)],
  );
  if (rows.length === 0) return [];
  const variants = await db.query<{ menu_id: number; diet: Diet; dishes: string }>(
    `SELECT menu_id, diet, dishes FROM canteen_menu_variants
      WHERE menu_id IN (${rows.map(() => '?').join(', ')})`,
    rows.map((r) => r.id),
  );
  return rows.map((r) => {
    const own: Partial<Record<Diet, string>> = {};
    for (const v of variants) if (num(v.menu_id) === num(r.id)) own[v.diet] = v.dishes;
    return { day: r.day, meal: num(r.meal_time_id), dishes: r.dishes, variants: own };
  });
}

/** Every menu of the organisation (the export). */
export async function allMenus(db: Db, orgId: number, userId: number): Promise<Menu[]> {
  await requireCan(db, orgId, userId, 'kitchen.view');
  return menusOf(db, orgId, '2000-01-01', 365 * 200);
}

/** The menus of the days from `from`, `days` long (the calendar's month). */
export async function menusBetween(
  db: Db,
  orgId: number,
  userId: number,
  from: IsoDate,
  days: number,
): Promise<Menu[]> {
  await requireCan(db, orgId, userId, 'kitchen.view');
  return menusOf(db, orgId, from, days);
}

export async function weekMenus(
  db: Db,
  orgId: number,
  userId: number,
  monday: IsoDate,
): Promise<Menu[]> {
  await requireCan(db, orgId, userId, 'kitchen.view');
  return menusOf(db, orgId, monday, 7);
}

export interface MenuInput {
  day: IsoDate;
  meal: number;
  dishes: string;
  variants: Partial<Record<Diet, string>>;
}

/** Saves a meal's menu and its diet variants; an empty menu removes it. */
export async function saveMenu(db: Db, orgId: number, userId: number, input: MenuInput) {
  await requireCan(db, orgId, userId, 'meals.edit');
  if (input.meal !== DELIVERY_MEAL) {
    const times = await mealTimesOf(db, orgId);
    if (!times.some((m) => m.id === input.meal)) throw new HttpError(404, 'notFound');
  }
  if (!input.dishes) {
    await db.execute(
      'DELETE FROM canteen_menus WHERE org_id = ? AND day = ? AND meal_time_id = ?',
      [orgId, input.day, input.meal],
    );
    return;
  }
  await db.execute(
    `INSERT INTO canteen_menus (org_id, day, meal_time_id, dishes, updated_by) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE dishes = VALUES(dishes), updated_by = VALUES(updated_by)`,
    [orgId, input.day, input.meal, input.dishes, userId],
  );
  const [menu] = await db.query<{ id: number }>(
    'SELECT id FROM canteen_menus WHERE org_id = ? AND day = ? AND meal_time_id = ?',
    [orgId, input.day, input.meal],
  );
  await db.execute('DELETE FROM canteen_menu_variants WHERE menu_id = ?', [menu!.id]);
  for (const diet of DIETS) {
    const dishes = input.variants[diet];
    if (!dishes) continue;
    await db.execute('INSERT INTO canteen_menu_variants (menu_id, diet, dishes) VALUES (?, ?, ?)', [
      menu!.id,
      diet,
      dishes,
    ]);
  }
}

/** Copies a week's menus onto another week, replacing what that week had. */
export async function copyWeek(
  db: Db,
  orgId: number,
  userId: number,
  fromMonday: IsoDate,
  toMonday: IsoDate,
): Promise<number> {
  await requireCan(db, orgId, userId, 'meals.edit');
  const menus = await menusOf(db, orgId, fromMonday, 7);
  await db.execute('DELETE FROM canteen_menus WHERE org_id = ? AND day >= ? AND day < ?', [
    orgId,
    toMonday,
    addDays(toMonday, 7),
  ]);
  const shift = Math.round(
    (Date.parse(`${toMonday}T12:00:00Z`) - Date.parse(`${fromMonday}T12:00:00Z`)) / 86_400_000,
  );
  for (const m of menus) {
    await saveMenu(db, orgId, userId, { ...m, day: addDays(m.day, shift) });
  }
  return menus.length;
}

/** The checks shared by the API for a menu's text. */
export function checkDishes(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new HttpError(400, 'invalidRequest');
  const text = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
  if (text.length > MAX_DISHES_LENGTH) {
    throw new HttpError(400, 'tooLong', { field: 'dishes', max: MAX_DISHES_LENGTH });
  }
  return text;
}

// ---------------------------------------------------------------------------------------------
// The kitchen sheet

/** Who eats, as the kitchen needs it: names, diets, allergies and delivery days only. */
export async function eatersOf(db: Db, orgId: number, userId: number): Promise<Eater[]> {
  await requireCan(db, orgId, userId, 'kitchen.view');
  const rows = await db.query<{
    id: number;
    first_name: string;
    last_name: string;
    kind: PersonKind;
    status: PersonStatus;
    diet: Diet;
    allergies: string | null;
    days: string | null;
  }>(
    `SELECT p.id, p.first_name, p.last_name, p.kind, p.status, p.diet, p.allergies,
            (SELECT GROUP_CONCAT(dd.weekday) FROM canteen_delivery_days dd WHERE dd.person_id = p.id) AS days
       FROM canteen_people p WHERE p.org_id = ? AND p.status = 'active'
        -- Nobody in hospital gets a meal.
        AND NOT EXISTS (SELECT 1 FROM canteen_hospital_stays h WHERE h.person_id = p.id AND h.returned_on IS NULL)`,
    [orgId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    firstName: r.first_name,
    lastName: r.last_name,
    kind: r.kind,
    status: r.status,
    diet: r.diet,
    allergies: r.allergies,
    deliveryDays: (r.days ?? '').split(',').filter(Boolean).map(Number),
  }));
}

export async function dayMenus(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
): Promise<Menu[]> {
  await requireCan(db, orgId, userId, 'kitchen.view');
  return menusOf(db, orgId, day, 1);
}
