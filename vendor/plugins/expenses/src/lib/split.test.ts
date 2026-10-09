import { describe, expect, it } from 'vitest';
import { balances, proportional, settleUp, splitExpense, type SplitEntry } from './split';

const entries = (...ids: number[]): SplitEntry[] => ids.map((memberId) => ({ memberId, value: 1 }));
const sum = (parts: Array<{ cents: number }>) => parts.reduce((a, p) => a + p.cents, 0);

describe('splitExpense', () => {
  it('splits equally and gives the odd cents to the payer', () => {
    const r = splitExpense(10_000, 'equal', entries(1, 2, 3), 2);
    expect(r).toEqual({
      ok: true,
      parts: [
        { memberId: 1, cents: 3333 },
        { memberId: 2, cents: 3334 },
        { memberId: 3, cents: 3333 },
      ],
    });
  });

  it('gives the odd cents to the first person when the payer does not take part', () => {
    const r = splitExpense(100, 'equal', entries(5, 6, 7), 9);
    expect(r.ok && r.parts.map((p) => p.cents)).toEqual([34, 33, 33]);
  });

  it('splits by shares, adding up exactly', () => {
    const r = splitExpense(
      10_000,
      'shares',
      [
        { memberId: 1, value: 2 },
        { memberId: 2, value: 1 },
      ],
      1,
    );
    expect(r.ok && r.parts.map((p) => p.cents)).toEqual([6667, 3333]);
  });

  it('splits by percent that adds up to 100', () => {
    const r = splitExpense(
      999,
      'percent',
      [
        { memberId: 1, value: 50 },
        { memberId: 2, value: 25 },
        { memberId: 3, value: 25 },
      ],
      3,
    );
    expect(r.ok && sum(r.parts)).toBe(999);
    // 499.5, 249.75, 249.75: the two largest fractions get the remaining cents.
    expect(r.ok && r.parts.map((p) => p.cents)).toEqual([499, 250, 250]);
    expect(
      splitExpense(
        1000,
        'percent',
        [
          { memberId: 1, value: 50 },
          { memberId: 2, value: 40 },
        ],
        1,
      ),
    ).toEqual({ ok: false, error: 'percentTotal' });
  });

  it('takes exact amounts only when they add up to the expense', () => {
    expect(
      splitExpense(
        2500,
        'exact',
        [
          { memberId: 1, value: 10 },
          { memberId: 2, value: 15 },
        ],
        1,
      ),
    ).toEqual({
      ok: true,
      parts: [
        { memberId: 1, cents: 1000 },
        { memberId: 2, cents: 1500 },
      ],
    });
    expect(
      splitExpense(
        2500,
        'exact',
        [
          { memberId: 1, value: 10 },
          { memberId: 2, value: 14.99 },
        ],
        1,
      ),
    ).toEqual({ ok: false, error: 'exactTotal' });
  });

  it('refuses no participants, negative values and all-zero shares', () => {
    expect(splitExpense(100, 'equal', [], 1)).toEqual({ ok: false, error: 'noParticipants' });
    expect(splitExpense(100, 'shares', [{ memberId: 1, value: -1 }], 1)).toEqual({
      ok: false,
      error: 'badValue',
    });
    expect(splitExpense(100, 'shares', [{ memberId: 1, value: 0 }], 1)).toEqual({
      ok: false,
      error: 'badValue',
    });
  });

  it('always adds up, whatever the numbers', () => {
    for (let total = 1; total < 2000; total += 37) {
      for (const weights of [
        [1, 1, 1],
        [3, 1],
        [1, 2, 3, 4, 5, 6, 7],
        [0.5, 0.25, 0.25],
      ]) {
        expect(proportional(total, weights).reduce((a, p) => a + p, 0)).toBe(total);
      }
    }
  });
});

describe('balances and settling up', () => {
  // Ana paid 90 for three, Bob paid 30 for Ana and himself, Cara paid Ana back 10.
  const memberIds = [1, 2, 3];
  const expenses = [
    {
      paidBy: 1,
      amountCents: 9000,
      shares: [
        { memberId: 1, cents: 3000 },
        { memberId: 2, cents: 3000 },
        { memberId: 3, cents: 3000 },
      ],
    },
    {
      paidBy: 2,
      amountCents: 3000,
      shares: [
        { memberId: 1, cents: 1500 },
        { memberId: 2, cents: 1500 },
      ],
    },
  ];
  const payments = [{ from: 3, to: 1, amountCents: 1000 }];

  it('adds what each paid and subtracts what each owes; the total is 0', () => {
    const b = balances(memberIds, expenses, payments);
    expect(Object.fromEntries(b)).toEqual({ 1: 3500, 2: -1500, 3: -2000 });
    expect([...b.values()].reduce((a, c) => a + c, 0)).toBe(0);
  });

  it('settles with the fewest transfers, largest debt first', () => {
    const plan = settleUp(balances(memberIds, expenses, payments));
    expect(plan).toEqual([
      { from: 3, to: 1, cents: 2000 },
      { from: 2, to: 1, cents: 1500 },
    ]);
  });

  it('needs no transfer when everyone is even', () => {
    expect(
      settleUp(
        new Map([
          [1, 0],
          [2, 0],
        ]),
      ),
    ).toEqual([]);
  });

  it('never needs more than people − 1 transfers', () => {
    const b = new Map([
      [1, 500],
      [2, -100],
      [3, -100],
      [4, -300],
      [5, 700],
      [6, -700],
    ]);
    const plan = settleUp(b);
    expect(plan.length).toBeLessThanOrEqual(5);
    const after = new Map(b);
    for (const t of plan) {
      after.set(t.from, after.get(t.from)! + t.cents);
      after.set(t.to, after.get(t.to)! - t.cents);
    }
    expect([...after.values()].every((c) => c === 0)).toBe(true);
  });
});
