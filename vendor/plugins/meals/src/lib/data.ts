import { randomInt } from 'node:crypto';
import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import type { IsoDate } from './dates';
import { HttpError } from './http';
import {
  LIMITS,
  isAllergen,
  isDiet,
  newInviteCode,
  type Allergen,
  type Diet,
  type Slot,
} from './plan';

/**
 * Data access for the meal planner, on its OWN database (ctx.db, ADR 0007). Visibility rule: a
 * person sees only households they are a member of. Planners change the household and plan;
 * members see the plan, swap meals and mark them cooked. Every function checks that first.
 */

export { HttpError };

type Db = Omit<PluginDatabase, 'transaction'>;

const DAY = (col: string, as: string) => `DATE_FORMAT(${col}, '%Y-%m-%d') AS ${as}`;
const num = (v: unknown) => Number(v);
const optNum = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const csv = <T extends string>(text: string, ok: (v: unknown) => v is T): T[] =>
  text
    .split(',')
    .map((x) => x.trim())
    .filter((x): x is T => ok(x));

// ---------------------------------------------------------------------------------------------
// Households

export type Role = 'planner' | 'member';

export interface Household {
  id: number;
  ownerId: number;
  name: string;
  diet: Diet | null;
  avoid: Allergen[];
  dislikes: string | null;
  kcalTarget: number;
  proteinTarget: number;
  timeZone: string;
}

export interface Membership {
  household: Household;
  role: Role;
  isPlanner: boolean;
  isOwner: boolean;
}

interface HouseholdRow {
  id: number;
  owner_user_id: number;
  name: string;
  diet: string;
  avoid: string;
  dislikes: string | null;
  kcal_target: number;
  protein_target: number;
  time_zone: string;
}

const HOUSEHOLD_COLUMNS = `h.id, h.owner_user_id, h.name, h.diet, h.avoid, h.dislikes, h.kcal_target,
  h.protein_target, h.time_zone`;

const toHousehold = (r: HouseholdRow): Household => ({
  id: num(r.id),
  ownerId: num(r.owner_user_id),
  name: r.name,
  diet: isDiet(r.diet) ? r.diet : null,
  avoid: csv(r.avoid, isAllergen),
  dislikes: r.dislikes,
  kcalTarget: num(r.kcal_target),
  proteinTarget: num(r.protein_target),
  timeZone: r.time_zone,
});

export async function membership(
  db: Db,
  householdId: number,
  userId: number,
): Promise<Membership | null> {
  const [row] = await db.query<HouseholdRow & { role: Role }>(
    `SELECT ${HOUSEHOLD_COLUMNS}, m.role FROM households h
       JOIN household_members m ON m.household_id = h.id AND m.user_id = ?
      WHERE h.id = ?`,
    [userId, householdId],
  );
  if (!row) return null;
  const household = toHousehold(row);
  return {
    household,
    role: row.role,
    isPlanner: row.role === 'planner',
    isOwner: household.ownerId === userId,
  };
}

export async function requireMember(db: Db, householdId: number, userId: number) {
  const m = await membership(db, householdId, userId);
  if (!m) throw new HttpError(404, 'householdNotFound');
  return m;
}

export async function requirePlanner(db: Db, householdId: number, userId: number) {
  const m = await requireMember(db, householdId, userId);
  if (!m.isPlanner) throw new HttpError(403, 'plannerOnly');
  return m;
}

export async function householdsOf(
  db: Db,
  userId: number,
): Promise<(Household & { role: Role })[]> {
  const rows = await db.query<HouseholdRow & { role: Role }>(
    `SELECT ${HOUSEHOLD_COLUMNS}, m.role FROM households h
       JOIN household_members m ON m.household_id = h.id AND m.user_id = ?
      ORDER BY h.name, h.id`,
    [userId],
  );
  return rows.map((r) => ({ ...toHousehold(r), role: r.role }));
}

export async function createHousehold(
  db: PluginDatabase,
  user: PluginUser,
  name: string,
  timeZone: string,
): Promise<number> {
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM households WHERE owner_user_id = ?',
    [user.id],
  );
  if (num(count?.n ?? 0) >= LIMITS.households) {
    throw new HttpError(400, 'tooManyHouseholds', { max: LIMITS.households });
  }
  return db.transaction(async (tx) => {
    const res = await tx.execute(
      'INSERT INTO households (owner_user_id, name, time_zone) VALUES (?, ?, ?)',
      [user.id, name, timeZone],
    );
    const displayName = user.displayName.slice(0, 80);
    await tx.execute(
      `INSERT INTO household_members (household_id, user_id, name, role) VALUES (?, ?, ?, 'planner')`,
      [res.insertId, user.id, displayName],
    );
    await tx.execute('INSERT INTO eaters (household_id, name, portion_size) VALUES (?, ?, 1)', [
      res.insertId,
      displayName.slice(0, 60),
    ]);
    return res.insertId;
  });
}

export interface HouseholdSettings {
  name: string;
  diet: Diet | null;
  avoid: Allergen[];
  dislikes: string | null;
  kcalTarget: number;
  proteinTarget: number;
}

export async function updateHousehold(
  db: Db,
  householdId: number,
  userId: number,
  s: HouseholdSettings,
  timeZone: string,
) {
  await requirePlanner(db, householdId, userId);
  await db.execute(
    `UPDATE households SET name = ?, diet = ?, avoid = ?, dislikes = ?, kcal_target = ?,
            protein_target = ?, time_zone = ?
      WHERE id = ?`,
    [
      s.name,
      s.diet ?? '',
      s.avoid.join(','),
      s.dislikes,
      s.kcalTarget,
      s.proteinTarget,
      timeZone,
      householdId,
    ],
  );
}

export async function deleteHousehold(db: Db, householdId: number, userId: number) {
  const m = await requireMember(db, householdId, userId);
  if (!m.isOwner) throw new HttpError(403, 'ownerOnly');
  await db.execute('DELETE FROM households WHERE id = ?', [householdId]);
}

// ---------------------------------------------------------------------------------------------
// Members and invites

export interface Member {
  userId: number;
  name: string;
  role: Role;
}

export async function membersOf(db: Db, householdId: number): Promise<Member[]> {
  const rows = await db.query<{ user_id: number; name: string; role: Role }>(
    `SELECT user_id, name, role FROM household_members WHERE household_id = ?
      ORDER BY role = 'planner' DESC, name, user_id`,
    [householdId],
  );
  return rows.map((r) => ({ userId: num(r.user_id), name: r.name, role: r.role }));
}

export async function activeInvite(db: Db, householdId: number): Promise<string | null> {
  const [row] = await db.query<{ code: string }>(
    `SELECT code FROM household_invites WHERE household_id = ? AND revoked_at IS NULL
      ORDER BY id DESC LIMIT 1`,
    [householdId],
  );
  return row?.code ?? null;
}

export async function newInvite(
  db: PluginDatabase,
  householdId: number,
  userId: number,
): Promise<string> {
  await requirePlanner(db, householdId, userId);
  return db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE household_invites SET revoked_at = UTC_TIMESTAMP()
        WHERE household_id = ? AND revoked_at IS NULL`,
      [householdId],
    );
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newInviteCode(randomInt);
      const [taken] = await tx.query<{ id: number }>(
        'SELECT id FROM household_invites WHERE code = ?',
        [code],
      );
      if (taken) continue;
      await tx.execute(
        'INSERT INTO household_invites (household_id, code, created_by) VALUES (?, ?, ?)',
        [householdId, code, userId],
      );
      return code;
    }
    throw new Error('could not make a unique invite code');
  });
}

export async function revokeInvite(db: Db, householdId: number, userId: number) {
  await requirePlanner(db, householdId, userId);
  await db.execute(
    `UPDATE household_invites SET revoked_at = UTC_TIMESTAMP()
      WHERE household_id = ? AND revoked_at IS NULL`,
    [householdId],
  );
}

export async function householdByInvite(db: Db, code: string) {
  const [row] = await db.query<{ id: number; name: string; owner: string | null; members: number }>(
    `SELECT h.id, h.name,
            (SELECT m.name FROM household_members m WHERE m.household_id = h.id AND m.user_id = h.owner_user_id) AS owner,
            (SELECT COUNT(*) FROM household_members m WHERE m.household_id = h.id) AS members
       FROM household_invites i JOIN households h ON h.id = i.household_id
      WHERE i.code = ? AND i.revoked_at IS NULL`,
    [code],
  );
  return row
    ? { id: num(row.id), name: row.name, owner: row.owner, members: num(row.members) }
    : null;
}

export async function joinByInvite(db: Db, code: string, user: PluginUser): Promise<number> {
  const h = await householdByInvite(db, code);
  if (!h) throw new HttpError(404, 'inviteInvalid');
  if (await membership(db, h.id, user.id)) return h.id;
  if (h.members >= LIMITS.members)
    throw new HttpError(400, 'tooManyMembers', { max: LIMITS.members });
  await db.execute(
    `INSERT INTO household_members (household_id, user_id, name, role) VALUES (?, ?, ?, 'member')`,
    [h.id, user.id, user.displayName.slice(0, 80)],
  );
  return h.id;
}

/** A planner changes a member's role or removes them; a member can leave. The owner stays. */
export async function setMemberRole(
  db: Db,
  householdId: number,
  memberId: number,
  userId: number,
  role: Role,
) {
  const m = await requirePlanner(db, householdId, userId);
  if (memberId === m.household.ownerId) throw new HttpError(400, 'ownerStaysPlanner');
  const res = await db.execute(
    'UPDATE household_members SET role = ? WHERE household_id = ? AND user_id = ?',
    [role, householdId, memberId],
  );
  if (res.affectedRows === 0) throw new HttpError(404, 'memberNotFound');
}

export async function removeMember(db: Db, householdId: number, memberId: number, userId: number) {
  const m = await requireMember(db, householdId, userId);
  if (memberId !== userId && !m.isPlanner) throw new HttpError(403, 'plannerOnly');
  if (memberId === m.household.ownerId) throw new HttpError(400, 'ownerCannotLeave');
  const res = await db.execute(
    'DELETE FROM household_members WHERE household_id = ? AND user_id = ?',
    [householdId, memberId],
  );
  if (res.affectedRows === 0) throw new HttpError(404, 'memberNotFound');
}

// ---------------------------------------------------------------------------------------------
// Eaters

export interface Eater {
  id: number;
  name: string;
  portion: number;
}

export async function eatersOf(db: Db, householdId: number): Promise<Eater[]> {
  const rows = await db.query<{ id: number; name: string; portion_size: string | number }>(
    'SELECT id, name, portion_size FROM eaters WHERE household_id = ? ORDER BY id',
    [householdId],
  );
  return rows.map((r) => ({ id: num(r.id), name: r.name, portion: Number(r.portion_size) }));
}

export async function addEater(
  db: Db,
  householdId: number,
  userId: number,
  name: string,
  portion: number,
) {
  await requirePlanner(db, householdId, userId);
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM eaters WHERE household_id = ?',
    [householdId],
  );
  if (num(count?.n ?? 0) >= LIMITS.eaters)
    throw new HttpError(400, 'tooManyEaters', { max: LIMITS.eaters });
  const res = await db.execute(
    'INSERT INTO eaters (household_id, name, portion_size) VALUES (?, ?, ?)',
    [householdId, name, portion],
  );
  return res.insertId;
}

export async function updateEater(
  db: Db,
  householdId: number,
  eaterId: number,
  userId: number,
  name: string,
  portion: number,
) {
  await requirePlanner(db, householdId, userId);
  const res = await db.execute(
    'UPDATE eaters SET name = ?, portion_size = ? WHERE id = ? AND household_id = ?',
    [name, portion, eaterId, householdId],
  );
  if (res.affectedRows === 0) throw new HttpError(404, 'eaterNotFound');
}

export async function deleteEater(db: Db, householdId: number, eaterId: number, userId: number) {
  await requirePlanner(db, householdId, userId);
  const res = await db.execute('DELETE FROM eaters WHERE id = ? AND household_id = ?', [
    eaterId,
    householdId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'eaterNotFound');
}

// ---------------------------------------------------------------------------------------------
// Meals and their parts

/** A part of a meal: a cookbook recipe (with its nutrition per portion copied) or a simple item. */
export interface MealItem {
  recipeRef: string | null;
  name: string;
  qty: number | null;
  unit: string | null;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface Meal {
  id: number;
  householdId: number;
  day: IsoDate;
  slot: Slot;
  title: string;
  servings: number;
  leftovers: boolean;
  cooked: boolean;
  note: string | null;
  remind: string | null;
  setId: number | null;
  items: MealItem[];
}

interface MealRow {
  id: number;
  household_id: number;
  day: string;
  slot: Slot;
  title: string;
  servings: number;
  leftovers: number;
  cooked: number;
  note: string | null;
  remind: string | null;
  set_id: number | null;
}

interface ItemRow {
  owner: number;
  recipe_ref: string | null;
  name: string;
  qty: string | number | null;
  unit: string | null;
  kcal: string | number | null;
  protein: string | number | null;
  carbs: string | number | null;
  fat: string | number | null;
}

const toItem = (r: ItemRow): MealItem => ({
  recipeRef: r.recipe_ref,
  name: r.name,
  qty: optNum(r.qty),
  unit: r.unit,
  kcal: optNum(r.kcal),
  protein: optNum(r.protein),
  carbs: optNum(r.carbs),
  fat: optNum(r.fat),
});

const MEAL_COLUMNS = `m.id, m.household_id, ${DAY('m.day', 'day')}, m.slot, m.title, m.servings,
  m.leftovers, m.cooked, m.note, m.remind, m.set_id`;

async function itemsOf(db: Db, table: 'meal_items' | 'meal_set_items', ids: number[]) {
  const map = new Map<number, MealItem[]>();
  if (ids.length === 0) return map;
  const marks = ids.map(() => '?').join(',');
  const rows = await db.query<ItemRow>(
    table === 'meal_items'
      ? `SELECT meal_id AS owner, recipe_ref, name, qty, unit, kcal, protein, carbs, fat
           FROM meal_items WHERE meal_id IN (${marks}) ORDER BY meal_id, position`
      : `SELECT set_id AS owner, recipe_ref, name, qty, unit, kcal, protein, carbs, fat
           FROM meal_set_items WHERE set_id IN (${marks}) ORDER BY set_id, position`,
    ids,
  );
  for (const r of rows) {
    const list = map.get(num(r.owner)) ?? [];
    list.push(toItem(r));
    map.set(num(r.owner), list);
  }
  return map;
}

async function withItems(db: Db, rows: MealRow[]): Promise<Meal[]> {
  const items = await itemsOf(
    db,
    'meal_items',
    rows.map((r) => num(r.id)),
  );
  return rows.map((r) => ({
    id: num(r.id),
    householdId: num(r.household_id),
    day: r.day,
    slot: r.slot,
    title: r.title,
    servings: num(r.servings),
    leftovers: Boolean(num(r.leftovers)),
    cooked: Boolean(num(r.cooked)),
    note: r.note,
    remind: r.remind,
    setId: optNum(r.set_id),
    items: items.get(num(r.id)) ?? [],
  }));
}

export async function mealsBetween(
  db: Db,
  householdId: number,
  from: IsoDate,
  to: IsoDate,
): Promise<Meal[]> {
  const rows = await db.query<MealRow>(
    `SELECT ${MEAL_COLUMNS} FROM meals m WHERE m.household_id = ? AND m.day BETWEEN ? AND ?
      ORDER BY m.day, FIELD(m.slot, 'breakfast', 'lunch', 'dinner', 'snack'), m.id`,
    [householdId, from, to],
  );
  return withItems(db, rows);
}

export async function mealById(db: Db, householdId: number, mealId: number): Promise<Meal | null> {
  const rows = await db.query<MealRow>(
    `SELECT ${MEAL_COLUMNS} FROM meals m WHERE m.id = ? AND m.household_id = ?`,
    [mealId, householdId],
  );
  return (await withItems(db, rows))[0] ?? null;
}

async function writeItems(
  db: Db,
  table: 'meal_items' | 'meal_set_items',
  ownerId: number,
  items: MealItem[],
  from = 0,
) {
  for (const [i, item] of items.entries()) {
    // sql-safe: table — one of the two fixed table names above; values as ? params.
    await db.execute(
      `INSERT INTO ${table} (${table === 'meal_items' ? 'meal_id' : 'set_id'}, position, recipe_ref, name, qty, unit, kcal, protein, carbs, fat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ownerId,
        from + i,
        item.recipeRef,
        item.name,
        item.qty,
        item.unit,
        item.kcal,
        item.protein,
        item.carbs,
        item.fat,
      ],
    );
  }
}

export interface MealInput {
  day: IsoDate;
  slot: Slot;
  title: string;
  servings: number;
  leftovers: boolean;
  note: string | null;
  remind: string | null;
  setId: number | null;
  items: MealItem[];
}

export async function addMeal(
  db: Db,
  householdId: number,
  userId: number,
  input: MealInput,
): Promise<number> {
  await requireMember(db, householdId, userId);
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM meals WHERE household_id = ? AND day = ?',
    [householdId, input.day],
  );
  if (num(count?.n ?? 0) >= LIMITS.mealsPerDay) {
    throw new HttpError(400, 'tooManyMeals', { max: LIMITS.mealsPerDay });
  }
  const res = await db.execute(
    `INSERT INTO meals (household_id, day, slot, title, servings, leftovers, note, remind, set_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      householdId,
      input.day,
      input.slot,
      input.title,
      input.servings,
      input.leftovers ? 1 : 0,
      input.note,
      input.remind,
      input.setId,
      userId,
    ],
  );
  await writeItems(db, 'meal_items', res.insertId, input.items.slice(0, LIMITS.itemsPerMeal));
  return res.insertId;
}

/** Adds parts to a planned meal (a recipe or an item "as part of the meal"). */
export async function addMealItems(
  db: Db,
  householdId: number,
  mealId: number,
  userId: number,
  items: MealItem[],
) {
  await requireMember(db, householdId, userId);
  const meal = await mealById(db, householdId, mealId);
  if (!meal) throw new HttpError(404, 'mealNotFound');
  if (meal.items.length + items.length > LIMITS.itemsPerMeal) {
    throw new HttpError(400, 'tooManyItems', { max: LIMITS.itemsPerMeal });
  }
  const [last] = await db.query<{ p: number | null }>(
    'SELECT MAX(position) AS p FROM meal_items WHERE meal_id = ?',
    [mealId],
  );
  await writeItems(
    db,
    'meal_items',
    mealId,
    items,
    last?.p === null || last?.p === undefined ? 0 : num(last.p) + 1,
  );
}

/** Removes the part at `index` (in the order shown). */
export async function deleteMealItem(
  db: Db,
  householdId: number,
  mealId: number,
  index: number,
  userId: number,
) {
  await requireMember(db, householdId, userId);
  const meal = await mealById(db, householdId, mealId);
  if (!meal) throw new HttpError(404, 'mealNotFound');
  const rows = await db.query<{ position: number }>(
    'SELECT position FROM meal_items WHERE meal_id = ? ORDER BY position',
    [mealId],
  );
  const position = rows[index]?.position;
  if (position === undefined) throw new HttpError(404, 'itemNotFound');
  await db.execute('DELETE FROM meal_items WHERE meal_id = ? AND position = ?', [mealId, position]);
}

/**
 * The meal planner's link point meal.add: a cookbook recipe joins the meal planned for that day
 * and slot as one of its parts, or becomes a new meal when there is none.
 */
export async function addRecipeToDay(
  db: Db,
  householdId: number,
  userId: number,
  args: { day: IsoDate; slot: Slot; servings: number; item: MealItem },
): Promise<number> {
  await requireMember(db, householdId, userId);
  const [existing] = await db.query<{ id: number }>(
    'SELECT id FROM meals WHERE household_id = ? AND day = ? AND slot = ? ORDER BY id LIMIT 1',
    [householdId, args.day, args.slot],
  );
  if (existing) {
    await addMealItems(db, householdId, num(existing.id), userId, [args.item]);
    return num(existing.id);
  }
  return addMeal(db, householdId, userId, {
    day: args.day,
    slot: args.slot,
    title: args.item.name.slice(0, LIMITS.mealTitle),
    servings: args.servings,
    leftovers: false,
    note: null,
    remind: null,
    setId: null,
    items: [args.item],
  });
}

export interface MealChange {
  day?: IsoDate;
  slot?: Slot;
  title?: string;
  servings?: number;
  cooked?: boolean;
  leftovers?: boolean;
  note?: string | null;
  remind?: string | null;
}

export async function updateMeal(
  db: Db,
  householdId: number,
  mealId: number,
  userId: number,
  change: MealChange,
) {
  await requireMember(db, householdId, userId);
  const sets: string[] = [];
  const values: unknown[] = [];
  const add = (column: string, value: unknown) => {
    sets.push(`${column} = ?`);
    values.push(value);
  };
  if (change.day !== undefined) add('day', change.day);
  if (change.slot !== undefined) add('slot', change.slot);
  if (change.title !== undefined) add('title', change.title);
  if (change.servings !== undefined) add('servings', change.servings);
  if (change.cooked !== undefined) add('cooked', change.cooked ? 1 : 0);
  if (change.leftovers !== undefined) add('leftovers', change.leftovers ? 1 : 0);
  if (change.note !== undefined) add('note', change.note);
  if (change.remind !== undefined) add('remind', change.remind);
  if (sets.length === 0) return;
  const assignments = sets.join(', ');
  // sql-safe: assignments — column names from the fixed list above, values as ? params.
  const res = await db.execute(
    `UPDATE meals SET ${assignments} WHERE id = ? AND household_id = ?`,
    [...values, mealId, householdId],
  );
  if (res.affectedRows === 0) throw new HttpError(404, 'mealNotFound');
}

export async function deleteMeal(db: Db, householdId: number, mealId: number, userId: number) {
  await requireMember(db, householdId, userId);
  const res = await db.execute('DELETE FROM meals WHERE id = ? AND household_id = ?', [
    mealId,
    householdId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'mealNotFound');
}

// ---------------------------------------------------------------------------------------------
// Saved meals (meal configurations), public ones with recommendations and comments

export interface MealSet {
  id: number;
  ownerId: number;
  ownerName: string;
  title: string;
  description: string | null;
  slot: Slot;
  servings: number;
  isPublic: boolean;
  recommendations: number;
  items: MealItem[];
}

interface SetRow {
  id: number;
  owner_user_id: number;
  owner_name: string;
  title: string;
  description: string | null;
  slot: Slot;
  servings: number;
  is_public: number;
  recommendations: number | string;
}

const SET_COLUMNS = `s.id, s.owner_user_id, s.owner_name, s.title, s.description, s.slot, s.servings,
  s.is_public, (SELECT COUNT(*) FROM meal_set_recommendations r WHERE r.set_id = s.id) AS recommendations`;

async function setsWithItems(db: Db, rows: SetRow[]): Promise<MealSet[]> {
  const items = await itemsOf(
    db,
    'meal_set_items',
    rows.map((r) => num(r.id)),
  );
  return rows.map((r) => ({
    id: num(r.id),
    ownerId: num(r.owner_user_id),
    ownerName: r.owner_name,
    title: r.title,
    description: r.description,
    slot: r.slot,
    servings: num(r.servings),
    isPublic: Boolean(num(r.is_public)),
    recommendations: num(r.recommendations),
    items: items.get(num(r.id)) ?? [],
  }));
}

/** A saved meal the person may see: their own, or a public one. */
export async function setById(db: Db, setId: number, userId: number): Promise<MealSet | null> {
  const rows = await db.query<SetRow>(
    `SELECT ${SET_COLUMNS} FROM meal_sets s WHERE s.id = ? AND (s.owner_user_id = ? OR s.is_public = 1)`,
    [setId, userId],
  );
  return (await setsWithItems(db, rows))[0] ?? null;
}

/** The person's saved meals, or every public one (most recommended first). */
export async function setsOf(
  db: Db,
  userId: number,
  which: 'mine' | 'community',
): Promise<MealSet[]> {
  const rows = await db.query<SetRow>(
    which === 'mine'
      ? `SELECT ${SET_COLUMNS} FROM meal_sets s WHERE s.owner_user_id = ? ORDER BY s.title, s.id`
      : `SELECT ${SET_COLUMNS} FROM meal_sets s WHERE s.is_public = 1
          ORDER BY recommendations DESC, s.published_at DESC, s.id DESC LIMIT 200`,
    which === 'mine' ? [userId] : [],
  );
  return setsWithItems(db, rows);
}

export interface SetInput {
  title: string;
  description: string | null;
  slot: Slot;
  servings: number;
  items: MealItem[];
}

export async function createSet(db: Db, user: PluginUser, input: SetInput): Promise<number> {
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM meal_sets WHERE owner_user_id = ?',
    [user.id],
  );
  if (num(count?.n ?? 0) >= LIMITS.setsPerUser) {
    throw new HttpError(400, 'tooManySets', { max: LIMITS.setsPerUser });
  }
  const res = await db.execute(
    `INSERT INTO meal_sets (owner_user_id, owner_name, title, description, slot, servings)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.displayName.slice(0, 80),
      input.title,
      input.description,
      input.slot,
      input.servings,
    ],
  );
  await writeItems(db, 'meal_set_items', res.insertId, input.items.slice(0, LIMITS.itemsPerMeal));
  return res.insertId;
}

async function requireOwnSet(db: Db, setId: number, userId: number) {
  const [row] = await db.query<{ owner_user_id: number }>(
    'SELECT owner_user_id FROM meal_sets WHERE id = ?',
    [setId],
  );
  if (!row) throw new HttpError(404, 'setNotFound');
  if (num(row.owner_user_id) !== userId) throw new HttpError(403, 'ownerOnly');
}

export async function updateSet(
  db: Db,
  setId: number,
  userId: number,
  change: { title: string; description: string | null },
) {
  await requireOwnSet(db, setId, userId);
  await db.execute('UPDATE meal_sets SET title = ?, description = ? WHERE id = ?', [
    change.title,
    change.description,
    setId,
  ]);
}

export async function deleteSet(db: Db, setId: number, userId: number) {
  await requireOwnSet(db, setId, userId);
  await db.execute('DELETE FROM meal_sets WHERE id = ?', [setId]);
  await db.execute('UPDATE meals SET set_id = NULL WHERE set_id = ?', [setId]);
}

export async function setSetPublic(db: Db, setId: number, userId: number, on: boolean) {
  await requireOwnSet(db, setId, userId);
  await db.execute(
    `UPDATE meal_sets SET is_public = ?,
            published_at = CASE WHEN ? = 1 THEN COALESCE(published_at, UTC_TIMESTAMP()) ELSE published_at END
      WHERE id = ?`,
    [on ? 1 : 0, on ? 1 : 0, setId],
  );
}

async function requirePublicSet(db: Db, setId: number) {
  const [row] = await db.query<{ owner_user_id: number; is_public: number }>(
    'SELECT owner_user_id, is_public FROM meal_sets WHERE id = ?',
    [setId],
  );
  if (!row || !num(row.is_public)) throw new HttpError(404, 'setNotFound');
  return num(row.owner_user_id);
}

export async function setRecommendation(db: Db, setId: number, userId: number, on: boolean) {
  const ownerId = await requirePublicSet(db, setId);
  if (ownerId === userId) throw new HttpError(400, 'ownSet');
  if (on) {
    await db.execute(
      'INSERT IGNORE INTO meal_set_recommendations (set_id, user_id) VALUES (?, ?)',
      [setId, userId],
    );
  } else {
    await db.execute('DELETE FROM meal_set_recommendations WHERE set_id = ? AND user_id = ?', [
      setId,
      userId,
    ]);
  }
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM meal_set_recommendations WHERE set_id = ?',
    [setId],
  );
  return num(count?.n ?? 0);
}

export async function recommendedBy(db: Db, setId: number, userId: number): Promise<boolean> {
  const [row] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM meal_set_recommendations WHERE set_id = ? AND user_id = ?',
    [setId, userId],
  );
  return num(row?.n ?? 0) > 0;
}

export interface Comment {
  id: number;
  setId: number;
  userId: number;
  name: string;
  body: string;
  /** UTC ISO. */
  at: string;
}

const UTC = (col: string, as: string) => `DATE_FORMAT(${col}, '%Y-%m-%dT%H:%i:%sZ') AS ${as}`;

interface CommentRow {
  id: number;
  set_id: number;
  user_id: number;
  user_name: string;
  body: string;
  at: string;
}

const toComment = (r: CommentRow): Comment => ({
  id: num(r.id),
  setId: num(r.set_id),
  userId: num(r.user_id),
  name: r.user_name,
  body: r.body,
  at: r.at,
});

export async function commentsOf(db: Db, setId: number): Promise<Comment[]> {
  const rows = await db.query<CommentRow>(
    `SELECT id, set_id, user_id, user_name, body, ${UTC('created_at', 'at')}
       FROM meal_set_comments WHERE set_id = ? ORDER BY created_at, id LIMIT 500`,
    [setId],
  );
  return rows.map(toComment);
}

export async function addComment(db: Db, setId: number, user: PluginUser, body: string) {
  await requirePublicSet(db, setId);
  const [recent] = await db.query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM meal_set_comments
      WHERE user_id = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`,
    [user.id],
  );
  if (num(recent?.n ?? 0) >= LIMITS.commentsPerHour) throw new HttpError(429, 'tooManyComments');
  const res = await db.execute(
    'INSERT INTO meal_set_comments (set_id, user_id, user_name, body) VALUES (?, ?, ?, ?)',
    [setId, user.id, user.displayName.slice(0, 80), body],
  );
  return res.insertId;
}

export async function deleteComment(db: Db, setId: number, commentId: number, userId: number) {
  const [row] = await db.query<{ user_id: number; owner_user_id: number }>(
    `SELECT c.user_id, s.owner_user_id FROM meal_set_comments c JOIN meal_sets s ON s.id = c.set_id
      WHERE c.id = ? AND c.set_id = ?`,
    [commentId, setId],
  );
  if (!row) throw new HttpError(404, 'commentNotFound');
  if (num(row.user_id) !== userId && num(row.owner_user_id) !== userId) {
    throw new HttpError(403, 'ownerOnly');
  }
  await db.execute('DELETE FROM meal_set_comments WHERE id = ?', [commentId]);
}

export async function commentsToNotify(db: Db, limit: number) {
  const rows = await db.query<CommentRow & { title: string; owner_user_id: number }>(
    `SELECT c.id, c.set_id, c.user_id, c.user_name, c.body, ${UTC('c.created_at', 'at')}, s.title,
            s.owner_user_id
       FROM meal_set_comments c JOIN meal_sets s ON s.id = c.set_id
      WHERE c.notified_at IS NULL AND c.user_id <> s.owner_user_id
        AND c.created_at > UTC_TIMESTAMP() - INTERVAL 7 DAY
      ORDER BY c.id LIMIT ${Math.trunc(limit)}`,
  );
  return rows.map((r) => ({ ...toComment(r), title: r.title, ownerId: num(r.owner_user_id) }));
}

export async function claimCommentNotice(db: Db, commentId: number) {
  const res = await db.execute(
    'UPDATE meal_set_comments SET notified_at = UTC_TIMESTAMP() WHERE id = ? AND notified_at IS NULL',
    [commentId],
  );
  return res.affectedRows > 0;
}

// ---------------------------------------------------------------------------------------------
// Reminders and the calendar link point

/** Meals with a reminder from `from` to `to`, with their household's zone. */
export async function mealsWithReminders(db: Db, from: IsoDate, to: IsoDate) {
  const rows = await db.query<{
    id: number;
    household_id: number;
    day: string;
    slot: Slot;
    title: string;
    remind: string;
    household: string;
    time_zone: string;
  }>(
    `SELECT m.id, m.household_id, ${DAY('m.day', 'day')}, m.slot, m.title, m.remind,
            h.name AS household, h.time_zone
       FROM meals m JOIN households h ON h.id = m.household_id
      WHERE m.remind IS NOT NULL AND m.day BETWEEN ? AND ?
        AND NOT EXISTS (SELECT 1 FROM meal_reminders_sent s WHERE s.meal_id = m.id AND s.day = m.day)`,
    [from, to],
  );
  return rows.map((r) => ({
    id: num(r.id),
    householdId: num(r.household_id),
    day: r.day,
    slot: r.slot,
    title: r.title,
    remind: r.remind,
    household: r.household,
    timeZone: r.time_zone,
  }));
}

export async function claimReminder(db: Db, mealId: number, day: IsoDate) {
  const res = await db.execute(
    'INSERT IGNORE INTO meal_reminders_sent (meal_id, day) VALUES (?, ?)',
    [mealId, day],
  );
  return res.affectedRows > 0;
}

export async function memberIds(db: Db, householdId: number): Promise<number[]> {
  const rows = await db.query<{ user_id: number }>(
    'SELECT user_id FROM household_members WHERE household_id = ?',
    [householdId],
  );
  return rows.map((r) => num(r.user_id));
}

/** Every meal of the person's households from `from` to `to`, for the calendar link point. */
export async function mealsOfUser(db: Db, userId: number, from: IsoDate, to: IsoDate) {
  const rows = await db.query<{
    id: number;
    household_id: number;
    day: string;
    slot: Slot;
    title: string;
    household: string;
  }>(
    `SELECT m.id, m.household_id, ${DAY('m.day', 'day')}, m.slot, m.title, h.name AS household
       FROM meals m JOIN households h ON h.id = m.household_id
       JOIN household_members hm ON hm.household_id = h.id AND hm.user_id = ?
      WHERE m.day BETWEEN ? AND ?
      ORDER BY m.day, FIELD(m.slot, 'breakfast', 'lunch', 'dinner', 'snack')`,
    [userId, from, to],
  );
  return rows.map((r) => ({
    id: num(r.id),
    householdId: num(r.household_id),
    day: r.day,
    slot: r.slot,
    title: r.title,
    household: r.household,
  }));
}

export { isAllergen, isDiet };
