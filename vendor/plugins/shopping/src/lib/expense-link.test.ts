import { describe, expect, it } from 'vitest';
import { boughtTotal, fittingGroups, listAsExpense } from './expense-link';

describe('a shopping list as a shared expense', () => {
  it('adds up what was bought, in cents', () => {
    expect(
      boughtTotal([
        { done: true, price: 2.49, quantity: 3 },
        { done: true, price: 0.1, quantity: null },
        { done: false, price: 100, quantity: 1 },
        { done: true, price: null, quantity: 2 },
      ]),
    ).toBe(7.57);
  });

  it('offers only groups with the currency and everyone on the list', () => {
    const groups = [
      { id: 1, name: 'Flat', currency: 'EUR', userIds: [1, 2] },
      { id: 2, name: 'Me', currency: 'EUR', userIds: [1] },
      { id: 3, name: 'Trip', currency: 'RON', userIds: [1, 2] },
    ];
    expect(fittingGroups(groups, 'EUR', [1, 2]).map((g) => g.id)).toEqual([1]);
  });

  it('splits it equally between the list’s people, once per list', () => {
    expect(
      listAsExpense({
        groupId: 1,
        listId: 7,
        name: 'Saturday',
        shopDate: '2026-10-10',
        currency: 'EUR',
        total: 7.57,
        userIds: [1, 2],
      }),
    ).toEqual({
      groupId: 1,
      title: 'Saturday',
      amount: 7.57,
      currency: 'EUR',
      spentOn: '2026-10-10',
      category: 'groceries',
      source: 'shopping:list:7',
      split: { mode: 'equal', userIds: [1, 2] },
    });
    expect(
      listAsExpense({
        groupId: 1,
        listId: 7,
        name: 'x',
        shopDate: '2026-10-10',
        currency: 'EUR',
        total: 0,
        userIds: [1],
      }),
    ).toBeNull();
  });
});
