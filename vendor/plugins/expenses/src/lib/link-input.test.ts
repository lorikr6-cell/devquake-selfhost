import { describe, expect, it } from 'vitest';
import { parseExpenseFromApp } from './link-input';

const base = {
  groupId: 4,
  title: 'Electricity · October',
  amount: 120.5,
  currency: 'ron',
  spentOn: '2026-10-15',
  category: 'utilities',
  source: 'utilities:bill:42',
};

describe('expense.add input', () => {
  it('accepts an equal split', () => {
    const parsed = parseExpenseFromApp(
      { ...base, split: { mode: 'equal', userIds: [1, 2] } },
      'utilities',
    );
    expect(parsed).toMatchObject({ groupId: 4, currency: 'RON', amount: 120.5, note: null });
    expect(parsed?.split).toEqual({ mode: 'equal', userIds: [1, 2] });
  });

  it('accepts exact shares only when they add up to the amount', () => {
    const shares = [
      { userId: 1, amount: 60.25 },
      { userId: 2, amount: 60.25 },
    ];
    expect(
      parseExpenseFromApp({ ...base, split: { mode: 'exact', shares } }, 'utilities')?.split,
    ).toEqual({
      mode: 'exact',
      shares,
    });
    expect(
      parseExpenseFromApp(
        { ...base, split: { mode: 'exact', shares: [{ userId: 1, amount: 100 }] } },
        'utilities',
      ),
    ).toBeNull();
  });

  it('refuses a source of another app, bad amounts, dates and people', () => {
    const split = { mode: 'equal', userIds: [1] };
    expect(parseExpenseFromApp({ ...base, split }, 'shopping')).toBeNull();
    expect(parseExpenseFromApp({ ...base, amount: -3, split }, 'utilities')).toBeNull();
    expect(parseExpenseFromApp({ ...base, spentOn: '2026-02-30', split }, 'utilities')).toBeNull();
    expect(parseExpenseFromApp({ ...base, category: 'cars', split }, 'utilities')).toBeNull();
    expect(
      parseExpenseFromApp({ ...base, split: { mode: 'equal', userIds: [1, 1] } }, 'utilities'),
    ).toBeNull();
    expect(
      parseExpenseFromApp({ ...base, split: { mode: 'equal', userIds: ['1'] } }, 'utilities'),
    ).toBeNull();
    expect(
      parseExpenseFromApp({ ...base, split: { mode: 'shares', userIds: [1] } }, 'utilities'),
    ).toBeNull();
    expect(parseExpenseFromApp(null, 'utilities')).toBeNull();
  });
});
