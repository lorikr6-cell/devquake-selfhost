import type { PluginDatabase } from '@devquake/plugin-sdk';

// Stock (venue migration 0009): ingredients with the stock on hand and a daily and weekly level,
// recipes of menu items, every change as a move, and what is short. Every function takes the
// venue from its caller. The pure parts are tested.

type Db = Omit<PluginDatabase, 'transaction'>;

export const UNITS = ['g', 'kg', 'ml', 'l', 'pcs'] as const;
export type Unit = (typeof UNITS)[number];
export const isUnit = (v: unknown): v is Unit => UNITS.includes(v as Unit);

/** Stock moves are kept this long. */
export const MOVES_KEEP_DAYS = 90;
export const QTY_MAX = 1_000_000;

export interface Ingredient {
  id: number;
  name: string;
  unit: Unit;
  stock: number;
  dailyTarget: number;
  weeklyTarget: number;
  countedAt: string | null;
}

/** A quantity as typed ("1,5", "250") with up to 3 decimals, or null. */
export function parseQty(raw: unknown): number | null {
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.');
  if (!/^\d+(\.\d{1,3})?$/.test(s)) return null;
  const n = Number(s);
  return n <= QTY_MAX ? n : null;
}

/** Rounded to 3 decimals (the database's precision). */
export const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** What to buy to reach a level: one line per ingredient below it, rounded up to whole units. */
export function toBuy(list: Ingredient[], level: 'daily' | 'weekly') {
  return list
    .map((i) => {
      const target = level === 'daily' ? i.dailyTarget : i.weeklyTarget;
      const missing = round3(target - i.stock);
      return { ingredient: i, qty: missing > 0 ? Math.ceil(missing) : 0 };
    })
    .filter((x) => x.qty > 0);
}

/**
 * Menu items that cannot be made now: those with a recipe line needing more than the stock. The
 * reply maps each such item to the ingredients that are short.
 */
export function shortItems(
  recipes: { itemId: number; ingredientId: number; qty: number }[],
  stock: Map<number, { name: string; stock: number }>,
): Map<number, string[]> {
  const out = new Map<number, string[]>();
  for (const r of recipes) {
    const s = stock.get(r.ingredientId);
    if (!s || s.stock + 1e-9 < r.qty)
      out.set(r.itemId, [...(out.get(r.itemId) ?? []), s?.name ?? '?']);
  }
  return out;
}

// --- the database ------------------------------------------------------------------------------

export async function ingredientsOf(db: Db, venueId: number): Promise<Ingredient[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    unit: Unit;
    stock: string | number;
    daily_target: string | number;
    weekly_target: string | number;
    counted_at: Date | null;
  }>(
    `SELECT id, name, unit, stock, daily_target, weekly_target, counted_at
       FROM ingredients WHERE venue_id = ? ORDER BY name LIMIT 1000`,
    [venueId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    unit: r.unit,
    stock: Number(r.stock),
    dailyTarget: Number(r.daily_target),
    weeklyTarget: Number(r.weekly_target),
    countedAt: r.counted_at ? new Date(r.counted_at).toISOString() : null,
  }));
}

export async function saveIngredient(
  db: Db,
  venueId: number,
  id: number | null,
  v: { name: string; unit: Unit; dailyTarget: number; weeklyTarget: number },
) {
  if (id === null) {
    await db.execute(
      `INSERT INTO ingredients (venue_id, name, unit, daily_target, weekly_target)
       VALUES (?, ?, ?, ?, ?)`,
      [venueId, v.name, v.unit, v.dailyTarget, v.weeklyTarget],
    );
    return true;
  }
  const r = await db.execute(
    `UPDATE ingredients SET name = ?, unit = ?, daily_target = ?, weekly_target = ?
      WHERE id = ? AND venue_id = ?`,
    [v.name, v.unit, v.dailyTarget, v.weeklyTarget, id, venueId],
  );
  return r.affectedRows === 1;
}

export async function removeIngredient(db: Db, venueId: number, id: number) {
  const r = await db.execute('DELETE FROM ingredients WHERE id = ? AND venue_id = ?', [
    id,
    venueId,
  ]);
  return r.affectedRows === 1;
}

/**
 * A change to one ingredient: a delivery or waste (relative), or a count (the new stock). The
 * stock never goes below zero; each change is kept as a move.
 */
export async function changeStock(
  db: Db,
  venueId: number,
  ingredientId: number,
  kind: 'count' | 'delivery' | 'waste',
  qty: number,
  by: string,
  ref: string | null = null,
) {
  const [row] = await db.query<{ stock: string | number }>(
    'SELECT stock FROM ingredients WHERE id = ? AND venue_id = ?',
    [ingredientId, venueId],
  );
  if (!row) return false;
  const before = Number(row.stock);
  const after = round3(
    kind === 'count' ? qty : kind === 'delivery' ? before + qty : Math.max(0, before - qty),
  );
  await db.execute(
    `UPDATE ingredients SET stock = ?, counted_at = IF(? = 'count', UTC_TIMESTAMP(), counted_at)
      WHERE id = ? AND venue_id = ?`,
    [after, kind, ingredientId, venueId],
  );
  await db.execute(
    `INSERT INTO stock_moves (venue_id, ingredient_id, change_qty, reason, ref, by_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [venueId, ingredientId, round3(after - before), kind, ref, by],
  );
  return true;
}

/**
 * An order (or its removal) takes its recipe off the stock (or puts it back): `sign` 1 for a
 * sale, -1 to undo one. Ingredients do not go below zero.
 */
export async function applyRecipe(
  db: Db,
  venueId: number,
  itemId: number,
  qty: number,
  sign: 1 | -1,
  by: string,
  ref: string,
) {
  const lines = await db.query<{ ingredient_id: number; qty: string | number }>(
    `SELECT r.ingredient_id, r.qty FROM recipe_lines r
       JOIN ingredients i ON i.id = r.ingredient_id AND i.venue_id = ?
      WHERE r.item_id = ?`,
    [venueId, itemId],
  );
  for (const l of lines) {
    const amount = round3(Number(l.qty) * qty);
    await db.execute(
      'UPDATE ingredients SET stock = GREATEST(stock - ?, 0) WHERE id = ? AND venue_id = ?',
      [sign * amount, l.ingredient_id, venueId],
    );
    await db.execute(
      `INSERT INTO stock_moves (venue_id, ingredient_id, change_qty, reason, ref, by_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [venueId, l.ingredient_id, -sign * amount, sign === 1 ? 'sale' : 'unsale', ref, by],
    );
  }
}

export interface RecipeLine {
  ingredientId: number;
  qty: number;
}

export async function recipesOf(db: Db, venueId: number) {
  const rows = await db.query<{ item_id: number; ingredient_id: number; qty: string | number }>(
    `SELECT r.item_id, r.ingredient_id, r.qty FROM recipe_lines r
       JOIN menu_items m ON m.id = r.item_id AND m.venue_id = ?`,
    [venueId],
  );
  return rows.map((r) => ({
    itemId: Number(r.item_id),
    ingredientId: Number(r.ingredient_id),
    qty: Number(r.qty),
  }));
}

/** Replaces an item's recipe (only the venue's own item and ingredients). */
export async function saveRecipe(db: Db, venueId: number, itemId: number, lines: RecipeLine[]) {
  const [item] = await db.query<{ id: number }>(
    'SELECT id FROM menu_items WHERE id = ? AND venue_id = ?',
    [itemId, venueId],
  );
  if (!item) return false;
  await db.execute('DELETE FROM recipe_lines WHERE item_id = ?', [itemId]);
  const own = new Set((await ingredientsOf(db, venueId)).map((i) => i.id));
  for (const l of lines.slice(0, 30)) {
    if (!own.has(l.ingredientId) || !(l.qty > 0)) continue;
    await db.execute(
      'INSERT INTO recipe_lines (item_id, ingredient_id, qty) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE qty = VALUES(qty)',
      [itemId, l.ingredientId, round3(l.qty)],
    );
  }
  return true;
}

/** Each short menu item of the venue with the ingredients that are short. */
export async function shortNow(db: Db, venueId: number) {
  const [recipes, list] = await Promise.all([recipesOf(db, venueId), ingredientsOf(db, venueId)]);
  return shortItems(recipes, new Map(list.map((i) => [i.id, { name: i.name, stock: i.stock }])));
}

/** The scheduled run: moves older than MOVES_KEEP_DAYS go. */
export async function deleteOldMoves(db: Db) {
  await db.execute(
    'DELETE FROM stock_moves WHERE at < UTC_TIMESTAMP() - INTERVAL ? DAY LIMIT 5000',
    [MOVES_KEEP_DAYS],
  );
}
