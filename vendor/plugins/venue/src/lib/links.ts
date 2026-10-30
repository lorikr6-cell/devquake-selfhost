import type { PluginDatabase, PluginLinksApi } from '@devquake/plugin-sdk';
import { allergenMask } from './model';

// The venue's links with other apps (ADR 0035): the shopping list it buys with (its costs) and
// recipes from the cookbook (menu items). The owner's choices live in venue_links (migration 0005).

type Db = Omit<PluginDatabase, 'transaction'>;

export const LINK_KINDS = ['shoppingList'] as const;
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
