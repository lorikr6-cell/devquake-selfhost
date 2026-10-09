// Product suggestions from the user's own shopping history (autocomplete and "Usual products").
// Pure: the rows come from suggestionRows() in data.ts.

export interface SuggestionRow {
  itemId: number;
  listId: number;
  shopDate: string;
  name: string;
  unit: string | null;
  quantity: number | null;
  price: number | null;
  description: string | null;
  storeName: string | null;
  storeType: string | null;
  storeLocation: string | null;
  storeDescription: string | null;
  /** Address of the item's photo, or null. */
  photo: string | null;
}

export interface Suggestion {
  name: string;
  unit: string | null;
  /** From the most recent time the product was on a list. */
  quantity: number | null;
  /** The most recent known price. */
  price: number | null;
  description: string | null;
  store: { name: string; type: string; location: string | null; description: string | null } | null;
  /** An item whose photo can be copied onto the new one, and its address (preview). */
  photoItemId: number | null;
  photo: string | null;
  /** How many times the product was on the user's lists. */
  times: number;
  lastDate: string;
}

/** Lower case without accents ("Pâine" → "paine"), for matching what the user types. */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('ro').trim();
}

const storeOf = (r: SuggestionRow): Suggestion['store'] =>
  r.storeName && r.storeType
    ? {
        name: r.storeName,
        type: r.storeType,
        location: r.storeLocation,
        description: r.storeDescription,
      }
    : null;

/**
 * One suggestion per product (name + unit): the newest quantity, and the newest known price,
 * description, store and photo; most frequent products first.
 */
export function buildSuggestions(rows: SuggestionRow[]): Suggestion[] {
  const sorted = [...rows].sort(
    (a, b) => b.shopDate.localeCompare(a.shopDate) || b.itemId - a.itemId,
  );
  const byKey = new Map<string, Suggestion>();
  for (const r of sorted) {
    const key = `${fold(r.name)}|${fold(r.unit ?? '')}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.times += 1;
      if (existing.price === null && r.price !== null) existing.price = r.price;
      if (existing.store === null) existing.store = storeOf(r);
      if (existing.description === null && r.description) existing.description = r.description;
      if (existing.photoItemId === null && r.photo) {
        existing.photoItemId = r.itemId;
        existing.photo = r.photo;
      }
      continue;
    }
    byKey.set(key, {
      name: r.name,
      unit: r.unit,
      quantity: r.quantity,
      price: r.price,
      description: r.description,
      store: storeOf(r),
      photoItemId: r.photo ? r.itemId : null,
      photo: r.photo,
      times: 1,
      lastDate: r.shopDate,
    });
  }
  return [...byKey.values()].sort(
    (a, b) =>
      b.times - a.times || b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name),
  );
}

/**
 * Suggestions for what the user is typing: names starting with it first, then names containing
 * it; each group keeps the "most frequent first" order. Empty input returns nothing.
 */
export function matchSuggestions(all: Suggestion[], query: string, limit = 8): Suggestion[] {
  const q = fold(query);
  if (!q) return [];
  const starts: Suggestion[] = [];
  const contains: Suggestion[] = [];
  for (const s of all) {
    const name = fold(s.name);
    if (name.startsWith(q) || name.split(/\s+/).some((word) => word.startsWith(q))) starts.push(s);
    else if (name.includes(q)) contains.push(s);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** The most frequent products that are not on the current list yet ("Usual products"). */
export function usualProducts(
  all: Suggestion[],
  onList: Array<{ name: string; unit: string | null }>,
  limit = 12,
): Suggestion[] {
  const present = new Set(onList.map((i) => `${fold(i.name)}|${fold(i.unit ?? '')}`));
  return all
    .filter((s) => s.times >= 2 && !present.has(`${fold(s.name)}|${fold(s.unit ?? '')}`))
    .slice(0, limit);
}
