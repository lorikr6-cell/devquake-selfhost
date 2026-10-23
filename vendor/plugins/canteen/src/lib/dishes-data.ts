import { createHash } from 'node:crypto';
import type { PluginDatabase, PluginLinkResult, PluginLinksApi } from '@devquake/plugin-sdk';
import { requireCan } from './data';
import type { IsoDate } from './dates';
import {
  inBatches,
  ingredientsFor,
  isScaling,
  itemsText,
  type Dish,
  type MealToCook,
  type ShoppingItem,
} from './dishes';
import { HttpError } from './http';
import { countByDiet, portionsFor } from './meals';
import { eatersOf, weekMenus } from './meals-data';

// Dishes from Cookbook and the purchasing list in Shopping (migration 0014, app links ADR 0035).
// Calls act for the signed-in staff member: they need both apps connected. What is copied (a
// dish) belongs to the organisation and stays when that person leaves; the list stays theirs in
// Shopping, the organisation only remembers which one it is.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v);

/** A link call's failure as the error the page shows. */
function linkError(app: 'cookbook' | 'shopping', res: PluginLinkResult): never {
  const error = res.ok ? 'unavailable' : res.error;
  if (error === 'not-connected' || error === 'no-access' || error === 'not-declared') {
    throw new HttpError(409, 'linkNotConnected', { app });
  }
  if (error === 'rate-limited') throw new HttpError(429, 'linkRateLimited');
  if (error === 'not-found') throw new HttpError(404, 'linkNotFound');
  throw new HttpError(502, 'linkFailed');
}

function needLinks(links: PluginLinksApi | undefined): PluginLinksApi {
  if (!links) throw new HttpError(409, 'linkNotConnected', { app: 'cookbook' });
  return links;
}

/** The organisation's dishes with their ingredients (planners and the kitchen). */
export async function listDishes(db: Db, orgId: number, userId: number): Promise<Dish[]> {
  await requireCan(db, orgId, userId, 'kitchen.view');
  return dishesOf(db, orgId);
}

async function dishesOf(db: Db, orgId: number): Promise<Dish[]> {
  const rows = await db.query<{
    id: number;
    title: string;
    base_servings: number;
    allergens: string;
  }>(
    'SELECT id, title, base_servings, allergens FROM canteen_dishes WHERE org_id = ? ORDER BY title',
    [orgId],
  );
  if (rows.length === 0) return [];
  const parts = await db.query<{
    dish_id: number;
    name: string;
    qty: string | number | null;
    unit: string | null;
    scaling: string;
  }>(
    `SELECT dish_id, name, qty, unit, scaling FROM canteen_dish_ingredients
      WHERE dish_id IN (${rows.map(() => '?').join(', ')}) ORDER BY dish_id, position`,
    rows.map((r) => r.id),
  );
  return rows.map((r) => ({
    id: num(r.id),
    title: r.title,
    baseServings: num(r.base_servings),
    allergens: r.allergens ? r.allergens.split(',') : [],
    ingredients: parts
      .filter((p) => num(p.dish_id) === num(r.id))
      .map((p) => ({
        name: p.name,
        qty: p.qty === null ? null : Number(p.qty),
        unit: p.unit,
        scaling: isScaling(p.scaling) ? p.scaling : 'linear',
      })),
  }));
}

export interface RecipeHit {
  ref: string;
  title: string;
  servings: number;
}

/** Recipes in the staff member's Cookbook matching `query`. */
export async function searchRecipes(
  db: Db,
  orgId: number,
  userId: number,
  links: PluginLinksApi | undefined,
  query: string,
): Promise<RecipeHit[]> {
  await requireCan(db, orgId, userId, 'meals.edit');
  const res = await needLinks(links).call<{ recipes?: RecipeHit[] }>('cookbook', 'recipes.search', {
    query: query.slice(0, 80),
    limit: 12,
  });
  if (!res.ok) linkError('cookbook', res);
  return (res.data.recipes ?? [])
    .filter((r) => typeof r?.ref === 'string' && typeof r.title === 'string')
    .map((r) => ({ ref: r.ref, title: r.title, servings: num(r.servings) || 1 }));
}

interface RecipeData {
  title: string;
  baseServings?: number;
  servings: number;
  allergens?: string[];
  perPortion?: { kcal?: number };
  ingredients: {
    name: string;
    qty: number | null;
    unit: string | null;
    baseQty?: number | null;
    scaling?: string;
  }[];
}

/**
 * Copies a Cookbook recipe into the organisation as a dish (again: refreshes it). The dish keeps
 * the recipe's name, so a menu line with that name is the dish.
 */
export async function importDish(
  db: PluginDatabase,
  orgId: number,
  userId: number,
  links: PluginLinksApi | undefined,
  ref: string,
): Promise<{ id: number; title: string }> {
  await requireCan(db, orgId, userId, 'meals.edit');
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(ref)) throw new HttpError(400, 'invalidRequest');
  const res = await needLinks(links).call<RecipeData>('cookbook', 'recipe.get', { ref });
  if (!res.ok) linkError('cookbook', res);
  const r = res.data;
  if (typeof r?.title !== 'string' || !Array.isArray(r.ingredients)) {
    throw new HttpError(502, 'linkFailed');
  }
  const title = r.title.trim().slice(0, 100);
  const base = Math.max(1, Math.round(num(r.baseServings ?? r.servings) || 1));
  const allergens = (r.allergens ?? [])
    .filter((a) => /^[a-z_-]{1,30}$/.test(a))
    .join(',')
    .slice(0, 160);
  const kcal = Number.isFinite(r.perPortion?.kcal) ? Number(r.perPortion!.kcal) : null;
  return db.transaction(async (tx) => {
    const [known] = await tx.query<{ id: number }>(
      'SELECT id FROM canteen_dishes WHERE org_id = ? AND (recipe_ref = ? OR title = ?) LIMIT 1',
      [orgId, ref, title],
    );
    let id: number;
    if (known) {
      id = num(known.id);
      await tx.execute(
        `UPDATE canteen_dishes SET recipe_ref = ?, title = ?, base_servings = ?, allergens = ?,
           kcal = ?, imported_by = ?, imported_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [ref, title, base, allergens, kcal, userId, id],
      );
      await tx.execute('DELETE FROM canteen_dish_ingredients WHERE dish_id = ?', [id]);
    } else {
      const res2 = await tx.execute(
        `INSERT INTO canteen_dishes (org_id, recipe_ref, title, base_servings, allergens, kcal, imported_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orgId, ref, title, base, allergens, kcal, userId],
      );
      id = res2.insertId;
    }
    let position = 0;
    for (const i of r.ingredients.slice(0, 120)) {
      if (typeof i?.name !== 'string' || !i.name.trim()) continue;
      // Older Cookbooks send only the scaled amount, for `servings` = the base.
      const qty = i.baseQty !== undefined ? i.baseQty : i.qty;
      await tx.execute(
        `INSERT INTO canteen_dish_ingredients (dish_id, position, name, qty, unit, scaling)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          position++,
          i.name.trim().slice(0, 80),
          typeof qty === 'number' && Number.isFinite(qty) ? qty : null,
          typeof i.unit === 'string' ? i.unit.slice(0, 16) : null,
          isScaling(i.scaling) ? i.scaling : 'linear',
        ],
      );
    }
    return { id, title };
  });
}

export async function deleteDish(db: Db, orgId: number, userId: number, dishId: number) {
  await requireCan(db, orgId, userId, 'meals.edit');
  await db.execute('DELETE FROM canteen_dishes WHERE id = ? AND org_id = ?', [dishId, orgId]);
}

/** The week's meals with their portions per diet (hospital stays already left out). */
async function weekToCook(db: Db, orgId: number, userId: number, monday: IsoDate) {
  const [menus, eaters] = await Promise.all([
    weekMenus(db, orgId, userId, monday),
    eatersOf(db, orgId, userId),
  ]);
  return menus.map((m): MealToCook => ({
    dishes: m.dishes,
    variants: m.variants,
    portions: countByDiet(portionsFor(eaters, m.day, m.meal)),
  }));
}

/** Everything the week's dishes need, merged (the preview before sending). */
export async function weekIngredients(
  db: Db,
  orgId: number,
  userId: number,
  monday: IsoDate,
): Promise<ShoppingItem[]> {
  await requireCan(db, orgId, userId, 'meals.edit');
  const [meals, dishes] = await Promise.all([
    weekToCook(db, orgId, userId, monday),
    dishesOf(db, orgId),
  ]);
  return ingredientsFor(meals, dishes);
}

export interface ListChoice {
  id: number;
  name: string;
}

/** The staff member's Shopping lists (also empty ones) and the organisation's purchasing list. */
export async function purchasingLists(
  db: Db,
  orgId: number,
  userId: number,
  links: PluginLinksApi | undefined,
): Promise<{ lists: ListChoice[]; chosen: ListChoice | null }> {
  await requireCan(db, orgId, userId, 'meals.edit');
  const res = await needLinks(links).call<{ lists?: ListChoice[] }>('shopping', 'lists.overview', {
    limit: 20,
    includeEmpty: true,
  });
  if (!res.ok) linkError('shopping', res);
  const [row] = await db.query<{ external_id: number; label: string }>(
    "SELECT external_id, label FROM canteen_org_links WHERE org_id = ? AND app = 'shopping'",
    [orgId],
  );
  return {
    lists: (res.data.lists ?? []).map((l) => ({ id: num(l.id), name: String(l.name) })),
    chosen: row ? { id: num(row.external_id), name: row.label } : null,
  };
}

/**
 * Sends the week's ingredients to a Shopping list (30 per call) and remembers it as the
 * organisation's purchasing list. `again` = the same items already went to that list.
 */
export async function sendWeekToShopping(
  db: Db,
  orgId: number,
  userId: number,
  links: PluginLinksApi | undefined,
  monday: IsoDate,
  list: ListChoice,
  force: boolean,
): Promise<{ sent: number; again: boolean }> {
  const items = await weekIngredients(db, orgId, userId, monday);
  if (items.length === 0) throw new HttpError(400, 'noIngredients');
  const digest = createHash('sha256').update(itemsText(items)).digest('hex');
  const [before] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM canteen_shopping_exports WHERE org_id = ? AND week = ? AND list_id = ? AND digest = ?',
    [orgId, monday, list.id, digest],
  );
  if (num(before?.n ?? 0) > 0 && !force) return { sent: 0, again: true };
  const api = needLinks(links);
  let sent = 0;
  for (const batch of inBatches(items)) {
    const res = await api.call<{ added?: number }>('shopping', 'list.add-items', {
      listId: list.id,
      items: batch.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    });
    if (!res.ok) linkError('shopping', res);
    sent += batch.length;
  }
  await db.execute(
    `INSERT INTO canteen_shopping_exports (org_id, week, list_id, items, digest, exported_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orgId, monday, list.id, sent, digest, userId],
  );
  await db.execute(
    `INSERT INTO canteen_org_links (org_id, app, external_id, label, set_by) VALUES (?, 'shopping', ?, ?, ?)
     ON DUPLICATE KEY UPDATE external_id = VALUES(external_id), label = VALUES(label),
       set_by = VALUES(set_by), set_at = CURRENT_TIMESTAMP`,
    [orgId, list.id, list.name.slice(0, 80), userId],
  );
  return { sent, again: false };
}
