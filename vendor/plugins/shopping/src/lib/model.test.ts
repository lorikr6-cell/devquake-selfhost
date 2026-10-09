import { describe, expect, it } from 'vitest';
import {
  INVITE_CODE_PATTERN,
  computeTotals,
  formatQuantity,
  groupByStore,
  isOpen,
  isWasted,
  lineTotal,
  newInviteCode,
  type Item,
  type Store,
} from './model';

const store = (id: number, name: string): Store => ({
  id,
  name,
  type: 'grocery',
  location: null,
  description: null,
});

let nextId = 1;
const item = (over: Partial<Item>): Item => ({
  id: nextId++,
  storeId: null,
  name: 'x',
  quantity: 1,
  unit: null,
  price: null,
  estimatedPrice: null,
  priceCorrectedByName: null,
  description: null,
  addedByName: null,
  done: false,
  doneByName: null,
  dropped: false,
  droppedByName: null,
  photo: null,
  ...over,
});

describe('lineTotal / computeTotals', () => {
  it('multiplies the unit price by the quantity, rounded to cents', () => {
    expect(lineTotal({ price: 4.99, quantity: 3 })).toBe(14.97);
    expect(lineTotal({ price: 12.49, quantity: 0.35 })).toBe(4.37);
    expect(lineTotal({ price: null, quantity: 2 })).toBeNull();
    expect(lineTotal({ price: 6.5, quantity: null })).toBe(6.5);
  });

  it('adds priced lines and counts the unpriced ones', () => {
    const totals = computeTotals([
      item({ price: 0.1, quantity: 3 }),
      item({ price: 0.2 }),
      item({ price: null }),
    ]);
    expect(totals).toEqual({ total: 0.5, unpriced: 1 });
  });
});

describe('groupByStore', () => {
  it('groups by store in list order, puts "any store" last and done items at the bottom', () => {
    const k = store(1, 'Kaufland');
    const d = store(2, 'Dedeman');
    const groups = groupByStore(
      [k, d],
      [
        item({ name: 'loose' }),
        item({ name: 'milk', storeId: 1, price: 5, done: true }),
        item({ name: 'bread', storeId: 1, price: 3 }),
        item({ name: 'screws', storeId: 2, price: 10, quantity: 2 }),
      ],
    );
    expect(groups.map((g) => g.store?.name ?? null)).toEqual(['Kaufland', 'Dedeman', null]);
    expect(groups[0]!.items.map((i) => i.name)).toEqual(['bread', 'milk']);
    expect(groups[0]!.total).toBe(8);
    expect(groups[1]!.total).toBe(20);
    expect(groups[2]!.unpriced).toBe(1);
  });

  it('skips stores without items and treats unknown store ids as "any store"', () => {
    const groups = groupByStore([store(1, 'Profi')], [item({ storeId: 99 })]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.store).toBeNull();
  });
});

describe('formatQuantity', () => {
  it('drops needless decimals and appends the unit', () => {
    expect(formatQuantity(2, null)).toBe('2');
    expect(formatQuantity(0.5, 'kg')).toBe('0.5 kg');
    expect(formatQuantity(1.25, 'l')).toBe('1.25 l');
    expect(formatQuantity(null, 'pack')).toBe('pack');
  });
});

describe('newInviteCode', () => {
  it('makes 8-character codes without look-alike characters', () => {
    let n = 0;
    const code = newInviteCode((max) => n++ % max);
    expect(code).toHaveLength(8);
    expect(INVITE_CODE_PATTERN.test(code)).toBe(true);
    expect(INVITE_CODE_PATTERN.test('ABCDEF0O')).toBe(false);
  });
});

describe('not needed (struck out)', () => {
  it('leaves the totals when struck out before buying, stays when already bought', () => {
    const items = [
      item({ price: 5 }),
      item({ price: 3, dropped: true }), // not needed, not bought: ignored
      item({ price: 2, done: true, dropped: true }), // bought anyway: money spent
      item({ price: null, dropped: true }), // not counted as unpriced either
    ];
    expect(computeTotals(items)).toEqual({ total: 7, unpriced: 0 });
    expect(computeTotals(items.filter(isOpen))).toEqual({ total: 5, unpriced: 0 });
    expect(items.filter(isWasted)).toHaveLength(1);
  });

  it('sorts to buy, bought, then not needed inside a store', () => {
    const [group] = groupByStore(
      [],
      [
        item({ name: 'gone', dropped: true }),
        item({ name: 'bought', done: true }),
        item({ name: 'todo' }),
      ],
    );
    expect(group!.items.map((i) => i.name)).toEqual(['todo', 'bought', 'gone']);
  });
});
