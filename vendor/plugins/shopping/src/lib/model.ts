// Plain types and pure helpers, shared by pages, client components and the API (no imports).

export interface Store {
  id: number;
  name: string;
  /** Store type code from the catalogue (store-types.ts). */
  type: string;
  location: string | null;
  description: string | null;
  /** The address of its logo (ADR 0052), or null/absent when there is none. */
  logo?: string | null;
}

export interface Item {
  id: number;
  storeId: number | null;
  name: string;
  /** Optional: many products are just "1 × unit" (e.g. Milk, 1 l). */
  quantity: number | null;
  /** Required for new items (kg, l, pcs, pack…); older items may have none. */
  unit: string | null;
  /** Price per unit (or per item without a quantity), null when not priced yet. */
  price: number | null;
  /** The planned price, when the price was corrected in the store (then `price` is the paid one). */
  estimatedPrice: number | null;
  /** Who corrected the price in the store, if someone did. */
  priceCorrectedByName: string | null;
  description: string | null;
  addedByName: string | null;
  done: boolean;
  doneByName: string | null;
  /** Struck out: not needed any more (it may have been bought already). */
  dropped: boolean;
  droppedByName: string | null;
  /** Address of the product photo, or null. */
  photo: string | null;
}

export interface Member {
  userId: number;
  displayName: string;
  role: 'owner' | 'member';
}

export interface ListSnapshot {
  id: number;
  name: string;
  currency: string;
  /** The day the shopping is planned for, "YYYY-MM-DD". */
  shopDate: string;
  version: number;
  role: 'owner' | 'member';
  members: Member[];
  stores: Store[];
  items: Item[];
}

export const CURRENCIES = ['RON', 'EUR', 'USD', 'HUF', 'GBP'] as const;

/** price x quantity (1 without a quantity), rounded to cents; null when not priced. */
export function lineTotal(item: Pick<Item, 'price' | 'quantity'>): number | null {
  if (item.price === null) return null;
  return Math.round(item.price * (item.quantity ?? 1) * 100) / 100;
}

export interface StoreGroup {
  /** null = items without a store. */
  store: Store | null;
  items: Item[];
  total: number;
  unpriced: number;
}

/**
 * Items grouped by store (stores in the list's order, "no store" last), each group with its
 * total. Open items come first, done items move to the bottom (shopping mode).
 */
/** Still to buy: not ticked off and not struck out. */
export const isOpen = (i: Pick<Item, 'done' | 'dropped'>) => !i.done && !i.dropped;
/** Bought and then struck out: the money is spent on something that was not needed. */
export const isWasted = (i: Pick<Item, 'done' | 'dropped'>) => i.done && i.dropped;
/** Counts towards the list's money: everything except items struck out before buying. */
export const countsTowardsTotal = (i: Pick<Item, 'done' | 'dropped'>) => i.done || !i.dropped;

/** Order inside a store: to buy, bought, not needed. */
const rank = (i: Item) => (i.dropped ? 2 : i.done ? 1 : 0);

export function groupByStore(stores: Store[], items: Item[]): StoreGroup[] {
  const known = new Map(stores.map((s) => [s.id, s]));
  const groups = new Map<number | null, StoreGroup>();
  for (const s of stores) groups.set(s.id, { store: s, items: [], total: 0, unpriced: 0 });
  for (const item of items) {
    const key = item.storeId !== null && known.has(item.storeId) ? item.storeId : null;
    let group = groups.get(key);
    if (!group) {
      group = { store: null, items: [], total: 0, unpriced: 0 };
      groups.set(null, group);
    }
    group.items.push(item);
    if (!countsTowardsTotal(item)) continue;
    const line = lineTotal(item);
    if (line === null) group.unpriced += 1;
    else group.total = Math.round((group.total + line) * 100) / 100;
  }
  return [...groups.values()]
    .filter((g) => g.items.length > 0)
    .sort((a, b) => (a.store === null ? 1 : 0) - (b.store === null ? 1 : 0))
    .map((g) => ({
      ...g,
      items: [...g.items].sort((a, b) => rank(a) - rank(b)), // stable: keeps list order
    }));
}

export interface Totals {
  total: number;
  unpriced: number;
}

/** Sum of the items that count (items struck out before buying do not). */
export function computeTotals(items: Item[]): Totals {
  let total = 0;
  let unpriced = 0;
  for (const item of items) {
    if (!countsTowardsTotal(item)) continue;
    const line = lineTotal(item);
    if (line === null) unpriced += 1;
    else total = Math.round((total + line) * 100) / 100;
  }
  return { total, unpriced };
}

/** `tag` is the page language's BCP 47 tag (LOCALE_TAGS in @devquake/ui). */
export function formatMoney(amount: number, currency: string, tag = 'en-GB'): string {
  try {
    return new Intl.NumberFormat(tag, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** "2 kg", "0.5 l", or just the unit ("pack") when there is no quantity. */
export function formatQuantity(quantity: number | null, unit: string | null): string {
  if (quantity === null) return unit ?? '';
  const q = Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(3)));
  return unit ? `${q} ${unit}` : q;
}

// Invite codes: no 0/O/1/I/L, so they are easy to read out loud or type from a QR label.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_PATTERN = /^[A-HJ-KM-NP-Z2-9]{8}$/;

export function newInviteCode(random: (max: number) => number): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}
