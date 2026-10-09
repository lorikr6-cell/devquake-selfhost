import { describe, expect, it } from 'vitest';
import {
  averageChange,
  estimateAccuracy,
  priceChanges,
  productKey,
  type PriceObservation,
} from './prices';

const o = (
  product: string,
  price: number,
  observedOn: string,
  kind: PriceObservation['kind'] = 'actual',
  itemId: number | null = null,
): PriceObservation => ({ product, unit: 'l', currency: 'RON', kind, price, observedOn, itemId });

describe('price history', () => {
  it('treats the same product the same whatever the spelling', () => {
    expect(productKey('Lapte ', 'L', 'RON')).toBe(productKey('lapte', 'l', 'RON'));
    expect(productKey('Cașcaval', null, 'RON')).toBe(productKey('cascaval', null, 'RON'));
  });

  it('shows the change from the first to the latest price, the paid price winning', () => {
    const changes = priceChanges([
      o('Milk', 5, '2026-01-10', 'estimate'),
      o('Milk', 5.5, '2026-01-10'), // paid: counts for that day
      o('milk', 6.05, '2026-06-02'),
      o('Bread', 4, '2026-02-01'),
      o('Bread', 4, '2026-03-01'),
      o('Cheese', 30, '2026-02-01'), // one day only: no change yet
    ]);
    expect(changes.map((c) => [c.product, c.first.price, c.last.price, c.changePercent])).toEqual([
      ['Milk', 5.5, 6.05, 10],
      ['Bread', 4, 4, 0],
    ]);
    expect(averageChange(changes)).toBe(5);
    expect(averageChange([])).toBeNull();
  });

  it('compares planned and paid prices of the same items', () => {
    expect(
      estimateAccuracy([
        o('Milk', 5, '2026-01-10', 'estimate', 1),
        o('Milk', 5.5, '2026-01-10', 'actual', 1),
        o('Bread', 4, '2026-01-10', 'estimate', 2),
        o('Bread', 3.8, '2026-01-10', 'actual', 2),
        o('Eggs', 12, '2026-01-10', 'estimate', 3),
      ]),
    ).toEqual({ averagePercent: 2.5, items: 2 });
    expect(estimateAccuracy([o('Eggs', 12, '2026-01-10', 'estimate', 3)])).toBeNull();
  });
});
