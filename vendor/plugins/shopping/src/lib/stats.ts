// Statistics over the lists a user is on (the "Statistics" tab). Pure: the data comes from
// statsInput() in data.ts, so this is easy to test. Money is always grouped by currency.

export interface StatsList {
  id: number;
  name: string;
  currency: string;
  shopDate: string;
  /** Deleted by its owner: gone from the app, still counted here. */
  deleted?: boolean;
}
export interface StatsMember {
  listId: number;
  userId: number;
  displayName: string;
}
export interface StatsItem {
  listId: number;
  storeId: number | null;
  name: string;
  unit: string | null;
  quantity: number | null;
  price: number | null;
  done: boolean;
  /** Struck out as not needed. */
  dropped: boolean;
  addedBy: number | null;
  doneBy: number | null;
}
export interface StatsStore {
  id: number;
  name: string;
  type: string;
}
export interface StatsInput {
  userId: number;
  lists: StatsList[];
  /** Members of those lists other than the user. */
  members: StatsMember[];
  items: StatsItem[];
  stores: StatsStore[];
}

export interface MoneyTotal {
  currency: string;
  /** Every priced item except those struck out before buying. */
  planned: number;
  /** Priced items that were ticked off (bought). */
  bought: number;
  /** Bought, then struck out as not needed: money spent for nothing. */
  wasted: number;
}

export interface WastedProduct {
  name: string;
  unit: string | null;
  currency: string;
  times: number;
  amount: number;
}
export interface StoreStat {
  name: string;
  type: string;
  currency: string;
  items: number;
  total: number;
}
export interface ProductStat {
  name: string;
  unit: string | null;
  currency: string;
  times: number;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  lastPrice: number | null;
}
export interface MonthStat {
  month: string; // "YYYY-MM"
  currency: string;
  lists: number;
  total: number;
}
export interface FriendStat {
  userId: number;
  displayName: string;
  /** Lists (of the user's) this friend was on. */
  together: number;
  /** together / all of the user's lists, 0..1. */
  share: number;
  itemsAdded: number;
  itemsPickedUp: number;
  lastDate: string | null;
  /** For each of `recentLists` (newest first): was this friend on it? */
  presence: boolean[];
}
export interface Stats {
  lists: number;
  items: number;
  itemsDone: number;
  /** Items struck out as not needed, and how many of them had already been bought. */
  notNeeded: number;
  notNeededBought: number;
  /** Products most often bought but then not needed. */
  wastedProducts: WastedProduct[];
  money: MoneyTotal[];
  stores: StoreStat[];
  products: ProductStat[];
  months: MonthStat[];
  friends: FriendStat[];
  recentLists: Array<{ id: number; name: string; shopDate: string; deleted: boolean }>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const line = (i: StatsItem) => (i.price === null ? null : round2(i.price * (i.quantity ?? 1)));

export const RECENT_LISTS = 12;

export function buildStats(input: StatsInput): Stats {
  const listById = new Map(input.lists.map((l) => [l.id, l]));
  const storeById = new Map(input.stores.map((s) => [s.id, s]));
  const items = input.items.filter((i) => listById.has(i.listId));

  // Money per currency.
  const money = new Map<string, MoneyTotal>();
  const wasted = new Map<string, WastedProduct>();
  for (const i of items) {
    const value = line(i);
    if (value === null) continue;
    if (i.dropped && !i.done) continue; // struck out before buying: never spent
    const currency = listById.get(i.listId)!.currency;
    const m = money.get(currency) ?? { currency, planned: 0, bought: 0, wasted: 0 };
    m.planned = round2(m.planned + value);
    if (i.done) m.bought = round2(m.bought + value);
    if (i.done && i.dropped) m.wasted = round2(m.wasted + value);
    money.set(currency, m);
  }
  for (const i of items) {
    if (!(i.done && i.dropped)) continue;
    const currency = listById.get(i.listId)!.currency;
    const key = `${i.name.toLocaleLowerCase('ro')}|${(i.unit ?? '').toLocaleLowerCase('ro')}|${currency}`;
    const w = wasted.get(key) ?? { name: i.name, unit: i.unit, currency, times: 0, amount: 0 };
    w.times += 1;
    w.amount = round2(w.amount + (line(i) ?? 0));
    wasted.set(key, w);
  }

  // Stores: same name and type across lists count as one store.
  const stores = new Map<string, StoreStat>();
  for (const i of items) {
    if (i.storeId === null || (i.dropped && !i.done)) continue;
    const store = storeById.get(i.storeId);
    if (!store) continue;
    const currency = listById.get(i.listId)!.currency;
    const key = `${store.name.toLocaleLowerCase('ro')}|${store.type}|${currency}`;
    const s = stores.get(key) ?? {
      name: store.name,
      type: store.type,
      currency,
      items: 0,
      total: 0,
    };
    s.items += 1;
    s.total = round2(s.total + (line(i) ?? 0));
    stores.set(key, s);
  }

  // Products by name (and unit); prices are per unit.
  const products = new Map<string, ProductStat & { sum: number; priced: number; last: string }>();
  for (const i of items) {
    const list = listById.get(i.listId)!;
    const key = `${i.name.toLocaleLowerCase('ro')}|${(i.unit ?? '').toLocaleLowerCase('ro')}|${list.currency}`;
    const p = products.get(key) ?? {
      name: i.name,
      unit: i.unit,
      currency: list.currency,
      times: 0,
      avgPrice: null,
      minPrice: null,
      maxPrice: null,
      lastPrice: null,
      sum: 0,
      priced: 0,
      last: '',
    };
    p.times += 1;
    if (i.price !== null) {
      p.sum += i.price;
      p.priced += 1;
      p.minPrice = p.minPrice === null ? i.price : Math.min(p.minPrice, i.price);
      p.maxPrice = p.maxPrice === null ? i.price : Math.max(p.maxPrice, i.price);
      if (list.shopDate >= p.last) {
        p.last = list.shopDate;
        p.lastPrice = i.price;
      }
    }
    products.set(key, p);
  }

  // Spending per month (by shopping date).
  const months = new Map<string, MonthStat & { ids: Set<number> }>();
  for (const l of input.lists) {
    const key = `${l.shopDate.slice(0, 7)}|${l.currency}`;
    if (!months.has(key)) {
      months.set(key, {
        month: l.shopDate.slice(0, 7),
        currency: l.currency,
        lists: 0,
        total: 0,
        ids: new Set(),
      });
    }
    const m = months.get(key)!;
    if (!m.ids.has(l.id)) {
      m.ids.add(l.id);
      m.lists += 1;
    }
  }
  for (const i of items) {
    if (i.dropped && !i.done) continue;
    const l = listById.get(i.listId)!;
    const m = months.get(`${l.shopDate.slice(0, 7)}|${l.currency}`)!;
    m.total = round2(m.total + (line(i) ?? 0));
  }

  // Friends: how often each person was on the user's lists.
  const recentLists = [...input.lists]
    .sort((a, b) => b.shopDate.localeCompare(a.shopDate) || b.id - a.id)
    .slice(0, RECENT_LISTS)
    .map((l) => ({ id: l.id, name: l.name, shopDate: l.shopDate, deleted: !!l.deleted }));
  const friends = new Map<number, FriendStat & { lists: Set<number> }>();
  for (const m of input.members) {
    if (m.userId === input.userId || !listById.has(m.listId)) continue;
    const f = friends.get(m.userId) ?? {
      userId: m.userId,
      displayName: m.displayName,
      together: 0,
      share: 0,
      itemsAdded: 0,
      itemsPickedUp: 0,
      lastDate: null,
      presence: [],
      lists: new Set<number>(),
    };
    f.lists.add(m.listId);
    const date = listById.get(m.listId)!.shopDate;
    if (!f.lastDate || date > f.lastDate) f.lastDate = date;
    friends.set(m.userId, f);
  }
  for (const i of items) {
    if (i.addedBy !== null) {
      const f = friends.get(i.addedBy);
      if (f) f.itemsAdded += 1;
    }
    if (i.done && i.doneBy !== null) {
      const f = friends.get(i.doneBy);
      if (f) f.itemsPickedUp += 1;
    }
  }
  const totalLists = input.lists.length;

  return {
    lists: totalLists,
    items: items.length,
    itemsDone: items.filter((i) => i.done).length,
    notNeeded: items.filter((i) => i.dropped).length,
    notNeededBought: items.filter((i) => i.dropped && i.done).length,
    wastedProducts: [...wasted.values()]
      .sort((a, b) => b.amount - a.amount || b.times - a.times)
      .slice(0, 5),
    money: [...money.values()].sort((a, b) => b.planned - a.planned),
    stores: [...stores.values()]
      .sort((a, b) => b.total - a.total || b.items - a.items)
      .slice(0, 10),
    products: [...products.values()]
      .map(({ sum, priced, last: _last, ...p }) => ({
        ...p,
        avgPrice: priced ? round2(sum / priced) : null,
      }))
      .sort((a, b) => b.times - a.times || a.name.localeCompare(b.name))
      .slice(0, 10),
    months: [...months.values()]
      .map(({ ids: _ids, ...m }) => m)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12),
    friends: [...friends.values()]
      .map(({ lists, ...f }) => ({
        ...f,
        together: lists.size,
        share: totalLists ? lists.size / totalLists : 0,
        presence: recentLists.map((l) => lists.has(l.id)),
      }))
      .sort((a, b) => b.together - a.together || a.displayName.localeCompare(b.displayName)),
    recentLists,
  };
}
