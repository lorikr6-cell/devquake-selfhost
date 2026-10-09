import { describe, expect, it } from 'vitest';
import { buildStats, type StatsInput, type StatsItem } from './stats';

const item = (over: Partial<StatsItem>): StatsItem => ({
  listId: 1,
  storeId: null,
  name: 'Milk',
  unit: 'l',
  quantity: null,
  price: null,
  done: false,
  dropped: false,
  addedBy: 10,
  doneBy: null,
  ...over,
});

const input: StatsInput = {
  userId: 10,
  lists: [
    { id: 1, name: 'Week 1', currency: 'RON', shopDate: '2026-09-01' },
    { id: 2, name: 'Week 2', currency: 'RON', shopDate: '2026-09-08' },
    { id: 3, name: 'Trip', currency: 'EUR', shopDate: '2026-08-20' },
  ],
  members: [
    { listId: 1, userId: 20, displayName: 'Bob' },
    { listId: 2, userId: 20, displayName: 'Bob' },
    { listId: 2, userId: 30, displayName: 'Cid' },
    { listId: 99, userId: 40, displayName: 'Not my list' },
  ],
  stores: [
    { id: 5, name: 'Kaufland', type: 'grocery' },
    { id: 6, name: 'kaufland', type: 'grocery' },
  ],
  items: [
    item({ listId: 1, storeId: 5, price: 7, quantity: 2, done: true, doneBy: 20 }),
    item({ listId: 2, storeId: 6, price: 8, done: true, doneBy: 10, addedBy: 20 }),
    item({ listId: 2, name: 'Bread', unit: 'pcs', price: null }),
    item({ listId: 3, name: 'Water', unit: 'l', price: 1.5, quantity: 4 }),
  ],
};

describe('buildStats', () => {
  const stats = buildStats(input);

  it('counts lists and items and totals money per currency', () => {
    expect(stats.lists).toBe(3);
    expect(stats.items).toBe(4);
    expect(stats.itemsDone).toBe(2);
    expect(stats.money).toEqual([
      { currency: 'RON', planned: 22, bought: 22, wasted: 0 },
      { currency: 'EUR', planned: 6, bought: 0, wasted: 0 },
    ]);
  });

  it('merges the same store across lists and ranks products', () => {
    expect(stats.stores).toEqual([
      { name: 'Kaufland', type: 'grocery', currency: 'RON', items: 2, total: 22 },
    ]);
    const milk = stats.products.find((p) => p.name === 'Milk')!;
    expect(milk).toMatchObject({ times: 2, avgPrice: 7.5, minPrice: 7, maxPrice: 8, lastPrice: 8 });
  });

  it('shows how often each friend joined, with presence on recent lists', () => {
    const bob = stats.friends.find((f) => f.displayName === 'Bob')!;
    expect(bob).toMatchObject({
      together: 2,
      itemsAdded: 1,
      itemsPickedUp: 1,
      lastDate: '2026-09-08',
    });
    expect(bob.share).toBeCloseTo(2 / 3);
    expect(stats.recentLists.map((l) => l.id)).toEqual([2, 1, 3]);
    expect(bob.presence).toEqual([true, true, false]);
    const cid = stats.friends.find((f) => f.displayName === 'Cid')!;
    expect(cid.presence).toEqual([true, false, false]);
    expect(stats.friends.some((f) => f.displayName === 'Not my list')).toBe(false);
  });

  it('groups months by shopping date and currency', () => {
    expect(stats.months).toEqual([
      { month: '2026-09', currency: 'RON', lists: 2, total: 22 },
      { month: '2026-08', currency: 'EUR', lists: 1, total: 6 },
    ]);
  });
});

describe('not needed items in statistics', () => {
  it('counts struck-out items and the money spent on ones already bought', () => {
    const stats = buildStats({
      ...input,
      items: [
        ...input.items,
        item({ listId: 1, name: 'Chips', unit: 'bag', price: 9, done: true, dropped: true }),
        item({ listId: 2, name: 'Chips', unit: 'bag', price: 8, done: true, dropped: true }),
        item({ listId: 2, name: 'Cake', unit: 'pcs', price: 30, dropped: true }), // never bought
      ],
    });
    expect(stats.notNeeded).toBe(3);
    expect(stats.notNeededBought).toBe(2);
    expect(stats.money[0]).toEqual({ currency: 'RON', planned: 39, bought: 39, wasted: 17 });
    expect(stats.wastedProducts).toEqual([
      { name: 'Chips', unit: 'bag', currency: 'RON', times: 2, amount: 17 },
    ]);
    expect(stats.months[0]!.total).toBe(39); // the cake was never spent
  });
});
