import { describe, expect, it } from 'vitest';
import { checkOrder, ORDER_LINES_MAX, ORDER_QTY_MAX } from './guest-orders';

const menu = [
  { id: 1, available: true, short: [] },
  { id: 2, available: false, short: [] },
  { id: 3, available: true, short: ['Oat drink'] },
  ...Array.from({ length: 20 }, (_, i) => ({ id: 10 + i, available: true, short: [] as string[] })),
];

describe('checkOrder', () => {
  it('keeps only what can be ordered now', () => {
    expect(
      checkOrder(
        [
          { itemId: 1, qty: 2, note: '  no  sugar ' },
          { itemId: 2, qty: 1 },
          { itemId: 3, qty: 1 },
          { itemId: 99, qty: 1 },
        ],
        menu,
      ),
    ).toEqual([{ itemId: 1, qty: 2, note: 'no sugar' }]);
  });

  it('adds up the same item, caps quantities and lines', () => {
    expect(
      checkOrder(
        [
          { itemId: 1, qty: 8 },
          { itemId: 1, qty: 8 },
        ],
        menu,
      ),
    ).toEqual([{ itemId: 1, qty: ORDER_QTY_MAX, note: null }]);
    const many = Array.from({ length: 20 }, (_, i) => ({ itemId: 10 + i, qty: 1 }));
    expect(checkOrder(many, menu)).toHaveLength(ORDER_LINES_MAX);
  });

  it('refuses nothing, nonsense and zero quantities', () => {
    expect(checkOrder([], menu)).toBeNull();
    expect(checkOrder('x', menu)).toBeNull();
    expect(checkOrder([{ itemId: 1, qty: 0 }], menu)).toBeNull();
  });
});
