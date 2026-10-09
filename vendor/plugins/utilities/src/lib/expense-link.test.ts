import { describe, expect, it } from 'vitest';
import { billAsExpense, fittingGroups } from './expense-link';

describe('a bill as a shared expense', () => {
  const groups = [
    { id: 1, name: 'Flat', currency: 'RON', userIds: [10, 11, 12] },
    { id: 2, name: 'Trip', currency: 'EUR', userIds: [10, 11, 12] },
    { id: 3, name: 'Couple', currency: 'RON', userIds: [10, 11] },
  ];

  it('offers only groups with the currency and everyone on the bill', () => {
    expect(fittingGroups(groups, 'RON', [10, 11, 12]).map((g) => g.id)).toEqual([1]);
    expect(fittingGroups(groups, 'RON', [10, 11]).map((g) => g.id)).toEqual([1, 3]);
  });

  it('sends the exact shares, paid by the owner, once per bill', () => {
    const input = billAsExpense({
      groupId: 1,
      billId: 42,
      title: 'Electricity · October 2026',
      total: 100,
      currency: 'RON',
      dueOn: null,
      period: '2026-10',
      lines: [
        { userId: 10, share: 33.34 },
        { userId: 11, share: 33.33 },
        { userId: 12, share: 33.33 },
      ],
    });
    expect(input).toMatchObject({
      groupId: 1,
      amount: 100,
      spentOn: '2026-10-01',
      category: 'utilities',
      source: 'utilities:bill:42',
      split: { mode: 'exact' },
    });
    expect(input!.split.shares).toHaveLength(3);
  });

  it('waits while a share is not known yet', () => {
    expect(
      billAsExpense({
        groupId: 1,
        billId: 1,
        title: 'Gas',
        total: 10,
        currency: 'RON',
        dueOn: '2026-10-20',
        period: '2026-10',
        lines: [{ userId: 10, share: null }],
      }),
    ).toBeNull();
  });
});
