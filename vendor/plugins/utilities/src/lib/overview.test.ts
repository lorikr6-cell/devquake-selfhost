import { describe, expect, it } from 'vitest';
import { addMonths, isIsoDate, isIsoMonth, monthsOf } from './dates';
import {
  categoryStats,
  monthSummaries,
  moneyTotals,
  yearsWithBills,
  type OverviewBill,
} from './overview';

function bill(partial: Partial<OverviewBill>): OverviewBill {
  return {
    billId: 1,
    utilityId: 1,
    utilityName: 'Power',
    category: 'electricity',
    currency: 'RON',
    unit: 'kWh',
    period: '2026-01',
    total: 100,
    consumption: 200,
    unitPrice: 0.5,
    status: 'paid',
    isOwner: true,
    myConsumption: 120,
    myShare: 60,
    myPaid: 60,
    ...partial,
  };
}

describe('dates', () => {
  it('handles months', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2025-12', 1)).toBe('2026-01');
    expect(monthsOf(2026)).toHaveLength(12);
    expect(isIsoMonth('2026-13')).toBe(false);
    expect(isIsoMonth('2026-02')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
  });
});

describe('overview', () => {
  const bills = [
    bill({ billId: 1, period: '2026-01' }),
    bill({
      billId: 2,
      period: '2026-02',
      myConsumption: 80,
      myShare: 40,
      myPaid: 0,
      status: 'open',
    }),
    bill({
      billId: 3,
      period: '2026-02',
      category: 'steam',
      unit: null,
      consumption: null,
      unitPrice: null,
      myConsumption: null,
      total: 30,
      myShare: 15,
      myPaid: 15,
    }),
    bill({ billId: 4, period: '2025-12', currency: 'EUR', myShare: 10, myPaid: 10, total: 20 }),
  ];

  it('sums money per currency', () => {
    expect(moneyTotals(bills)).toEqual([
      { currency: 'RON', billed: 230, share: 115, paid: 75 },
      { currency: 'EUR', billed: 20, share: 10, paid: 10 },
    ]);
  });

  it('groups a year by month and counts open bills', () => {
    const months = monthSummaries(bills, 2026);
    expect(months).toHaveLength(12);
    expect(months[1]!.bills.map((b) => b.billId)).toEqual([2, 3]);
    expect(months[1]!.open).toBe(1);
    expect(months[2]!.bills).toEqual([]);
  });

  it('builds per-category series without mixing units or currencies', () => {
    const stats = categoryStats(bills, 2026);
    expect(stats.map((s) => s.key)).toEqual(['electricity|kWh|RON', 'steam||RON']);
    const power = stats[0]!;
    expect(power.points[0]).toEqual({
      month: '2026-01',
      consumption: 120,
      share: 60,
      paid: 60,
      unitPrice: 0.5,
    });
    expect(power.points[2]!.share).toBeNull();
    expect(power.totals).toEqual({
      consumption: 200,
      share: 100,
      paid: 60,
      unitPrice: 0.5,
      bills: 2,
    });
    expect(stats[1]!.totals.consumption).toBeNull();
  });

  it('lists years with bills', () => {
    expect(yearsWithBills(bills, 2027)).toEqual([2027, 2026, 2025]);
  });
});
