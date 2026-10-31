import type { PluginDatabase, PluginLinksApi } from '@devquake/plugin-sdk';
import { allergenMask } from './model';

// The venue's links with other apps (ADR 0035): the shopping list it buys with (its costs) and
// recipes from the cookbook (menu items). The owner's choices live in venue_links (migration 0005).

type Db = Omit<PluginDatabase, 'transaction'>;

export const LINK_KINDS = ['shoppingList', 'expensesGroup', 'utilities', 'darts'] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export async function venueLink(db: Db, venueId: number, kind: LinkKind) {
  const [r] = await db.query<{ ref: string; name: string }>(
    'SELECT ref, name FROM venue_links WHERE venue_id = ? AND kind = ?',
    [venueId, kind],
  );
  return r ?? null;
}

export async function setVenueLink(
  db: Db,
  venueId: number,
  kind: LinkKind,
  link: { ref: string; name: string } | null,
) {
  if (!link) {
    await db.execute('DELETE FROM venue_links WHERE venue_id = ? AND kind = ?', [venueId, kind]);
    return;
  }
  await db.execute(
    `INSERT INTO venue_links (venue_id, kind, ref, name) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE ref = VALUES(ref), name = VALUES(name)`,
    [venueId, kind, link.ref.slice(0, 40), link.name.slice(0, 100)],
  );
}

/** The member's shopping lists (to choose the venue's purchasing list). */
export async function shoppingLists(links: PluginLinksApi) {
  const r = await links.call<{ lists?: { id: number; name: string }[] }>(
    'shopping',
    'lists.overview',
    { limit: 20, includeEmpty: true },
  );
  return r.ok && Array.isArray(r.data.lists)
    ? r.data.lists.map((l) => ({ id: Number(l.id), name: String(l.name) }))
    : null;
}

/** What was bought on the venue's purchasing list in a range (at most 62 days), or null. */
export async function purchases(links: PluginLinksApi, listId: number, from: string, to: string) {
  const r = await links.call<{
    list?: { currency: string; name: string };
    items?: { day: string; name: string; total: number }[];
    total?: number;
  }>('shopping', 'list.purchases', { listId, from, to });
  if (!r.ok || typeof r.data.total !== 'number') return null;
  return {
    currency: r.data.list?.currency ?? '',
    total: r.data.total,
    items: (r.data.items ?? []).slice(0, 1000),
  };
}

/** The biggest purchases by name (for the report). */
export function topPurchases(items: { name: string; total: number }[], n = 10) {
  const by = new Map<string, number>();
  for (const i of items) by.set(i.name, (by.get(i.name) ?? 0) + i.total);
  return [...by.entries()]
    .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}

/** Recipes from the cookbook matching a search (for "Add from your cookbook"). */
export async function searchRecipes(links: PluginLinksApi, query: string) {
  const r = await links.call<{
    recipes?: { ref: string; title: string; minutes: number; allergens: string[] }[];
  }>('cookbook', 'recipes.search', { query, limit: 12 });
  if (!r.ok || !Array.isArray(r.data.recipes)) return null;
  return r.data.recipes.map((x) => ({
    ref: String(x.ref),
    title: String(x.title),
    minutes: Number(x.minutes) || 0,
    allergens: allergenMask(Array.isArray(x.allergens) ? x.allergens.map(String) : []),
  }));
}

/** One recipe as a menu item to fill in: its name, its ingredients as the description, allergens. */
export async function recipeAsItem(links: PluginLinksApi, ref: string) {
  const r = await links.call<{
    title?: string;
    ingredients?: { name: string }[];
    allergens?: string[];
  }>('cookbook', 'recipe.get', { ref });
  if (!r.ok || typeof r.data.title !== 'string') return null;
  const ingredients = (r.data.ingredients ?? []).map((i) => String(i.name)).filter(Boolean);
  return {
    name: r.data.title.slice(0, 80),
    description: ingredients.join(', ').slice(0, 400) || null,
    allergens: allergenMask(Array.isArray(r.data.allergens) ? r.data.allergens.map(String) : []),
  };
}

// --- Expenses, Utilities and Darts (0.5.0) ------------------------------------------------------

/** The member's expense groups (to choose where the venue's costs are booked). */
export async function expenseGroups(links: PluginLinksApi) {
  const r = await links.call<{ groups?: { id: number; name: string; currency: string }[] }>(
    'expenses',
    'groups.overview',
  );
  return r.ok && Array.isArray(r.data.groups)
    ? r.data.groups.map((g) => ({
        id: Number(g.id),
        name: String(g.name),
        currency: String(g.currency),
      }))
    : null;
}

/** Books one amount in an expense group, paid by the member; the same source twice adds nothing. */
export async function bookExpense(
  links: PluginLinksApi,
  input: {
    groupId: number;
    title: string;
    amount: number;
    currency: string;
    spentOn: string;
    source: string;
    userId: number;
  },
) {
  return links.call<{ created?: boolean }>('expenses', 'expense.add', {
    groupId: input.groupId,
    title: input.title,
    amount: input.amount,
    currency: input.currency,
    spentOn: input.spentOn,
    category: 'other',
    source: input.source,
    split: { mode: 'equal', userIds: [input.userId] },
  });
}

/** The member's utilities (to choose the venue's). */
export async function utilityList(links: PluginLinksApi) {
  const r = await links.call<{ utilities?: { id: number; name: string; currency: string }[] }>(
    'utilities',
    'utilities.list',
  );
  return r.ok && Array.isArray(r.data.utilities)
    ? r.data.utilities.map((u) => ({
        id: Number(u.id),
        name: String(u.name),
        currency: String(u.currency),
      }))
    : null;
}

/** The chosen utilities' bills with a period in the range, or null. */
export async function utilityBills(links: PluginLinksApi, ids: number[], from: string, to: string) {
  if (!ids.length) return [];
  const r = await links.call<{
    bills?: { utility: string; period: string; total: number; currency: string }[];
  }>('utilities', 'bills.costs', { from, to, utilityIds: ids });
  return r.ok && Array.isArray(r.data.bills) ? r.data.bills : null;
}

/** The chosen ids from a stored list ("3,7,12"). */
export const idsOf = (ref: string | undefined | null) =>
  (ref ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

/** Totals by currency (bills may be in several). */
export function byCurrency(items: { currency: string; total: number }[]) {
  const sums = new Map<string, number>();
  for (const i of items) sums.set(i.currency, (sums.get(i.currency) ?? 0) + i.total);
  return [...sums.entries()].map(([currency, total]) => ({
    currency,
    total: Math.round(total * 100) / 100,
  }));
}

/** How often the darts copy is refreshed (the owner opening Venue triggers it). */
const DARTS_MINUTES = 10;

export interface VenueTournament {
  ref: string;
  name: string;
  game: string;
  status: string;
  players: number;
  fee: string | null;
  url: string | null;
}

/** The copy of the owner's open darts tournaments shown on the public menu. */
export async function venueTournaments(db: Db, venueId: number): Promise<VenueTournament[]> {
  const rows = await db.query<{
    ref: string;
    name: string;
    game: string;
    status: string;
    players: number;
    fee: string | null;
    url: string | null;
  }>(
    'SELECT ref, name, game, status, players, fee, url FROM venue_darts WHERE venue_id = ? ORDER BY name',
    [venueId],
  );
  return rows.map((r) => ({ ...r, players: Number(r.players) }));
}

/**
 * Refreshes the darts copy from the owner's Darts (only while they show it, at most every
 * DARTS_MINUTES); the tournaments that are finished or gone leave the copy.
 */
export async function syncDarts(db: Db, venueId: number, links: PluginLinksApi | undefined) {
  if (!links || !(await venueLink(db, venueId, 'darts'))) return;
  const [fresh] = await db.query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM venue_darts
      WHERE venue_id = ? AND synced_at > UTC_TIMESTAMP() - INTERVAL ? MINUTE`,
    [venueId, DARTS_MINUTES],
  );
  if (Number(fresh?.n ?? 0) > 0) return;
  const r = await links.call<{
    tournaments?: {
      id: number;
      name: string;
      gameName: string;
      status: string;
      joinCode: string;
      feeCents: number;
      currency: string;
      players: number;
    }[];
  }>('darts', 'tournaments.open');
  if (!r.ok || !Array.isArray(r.data.tournaments)) return;
  await db.execute('DELETE FROM venue_darts WHERE venue_id = ?', [venueId]);
  for (const x of r.data.tournaments.slice(0, 20)) {
    const url =
      x.status === 'registration' ? links.deepLink('darts', 'join', { code: x.joinCode }) : null;
    await db.execute(
      `INSERT INTO venue_darts (venue_id, ref, name, game, status, players, fee, url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        venueId,
        String(x.id).slice(0, 20),
        String(x.name).slice(0, 80),
        String(x.gameName).slice(0, 60),
        String(x.status).slice(0, 12),
        Math.min(65535, Number(x.players) || 0),
        x.feeCents > 0 ? `${(x.feeCents / 100).toFixed(2)} ${x.currency}` : null,
        url,
      ],
    );
  }
}
