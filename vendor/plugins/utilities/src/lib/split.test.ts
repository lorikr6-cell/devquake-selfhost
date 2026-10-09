import { describe, expect, it } from 'vitest';
import {
  distributeCents,
  effectiveUnitPrice,
  splitBill,
  splitUtility,
  type SplitBill,
} from './split';

const OWNER = 1;

function bill(
  partial: Partial<SplitBill> & { participants: SplitBill['participants'] },
): SplitBill {
  return {
    id: 1,
    total: 100,
    consumption: null,
    unitPrice: null,
    providerPaid: false,
    payments: new Map(),
    ...partial,
  };
}

const person = (userId: number, consumption: number | null = null) => ({
  userId,
  displayName: `P${userId}`,
  consumption,
});

describe('distributeCents', () => {
  it('adds up exactly and gives leftover cents to the owner', () => {
    expect(distributeCents(1000, 3, 0)).toEqual([334, 333, 333]);
    expect(distributeCents(1000, 3, 2)).toEqual([333, 333, 334]);
    expect(distributeCents(-100, 3, 1)).toEqual([-33, -34, -33]);
    expect(distributeCents(500, 0, 0)).toEqual([]);
  });
});

describe('effectiveUnitPrice', () => {
  it('prefers the bill price, then total ÷ billed consumption, then ÷ readings', () => {
    expect(effectiveUnitPrice(bill({ unitPrice: 0.9, participants: [] }), true)).toBe(0.9);
    expect(effectiveUnitPrice(bill({ consumption: 200, participants: [] }), true)).toBe(0.5);
    const readings = bill({ participants: [person(1, 30), person(2, 20)] });
    expect(effectiveUnitPrice(readings, true)).toBe(2);
    expect(effectiveUnitPrice(readings, false)).toBeNull();
    expect(effectiveUnitPrice(bill({ participants: [person(1, 30), person(2)] }), true)).toBeNull();
  });
});

describe('splitBill: equal split', () => {
  it('splits the total equally, owner absorbs the odd cent', () => {
    const s = splitBill(
      bill({ participants: [person(OWNER), person(2), person(3)] }),
      OWNER,
      false,
    );
    expect(s.lines.map((l) => l.share)).toEqual([33.34, 33.33, 33.33]);
    expect(s.lines[0]!.due).toBeNull();
    expect(s.lines[0]!.state).toBe('owner');
    expect(s.lines[1]!.state).toBe('unpaid');
    expect(s.outstanding).toBe(66.66);
    expect(s.status).toBe('open');
  });

  it('is paid (green) once everyone paid and the provider was paid', () => {
    const payments = new Map([
      [2, 50],
      [3, 50],
    ]);
    const base = { participants: [person(OWNER), person(2)], payments };
    expect(splitBill(bill(base), OWNER, false).status).toBe('open');
    const s = splitBill(bill({ ...base, providerPaid: true }), OWNER, false);
    expect(s.status).toBe('paid');
    expect(s.lines[1]!.state).toBe('paid');
  });

  it('a bill used by the owner alone is paid when the provider is paid', () => {
    expect(
      splitBill(bill({ participants: [person(OWNER)], providerPaid: true }), OWNER, false).status,
    ).toBe('paid');
  });
});

describe('splitBill: meter readings', () => {
  it('waits for readings and shows provisional bases', () => {
    const s = splitBill(
      bill({ total: 100, unitPrice: 1, participants: [person(OWNER, 40), person(2)] }),
      OWNER,
      true,
    );
    expect(s.status).toBe('awaiting');
    expect(s.missingReadings).toBe(1);
    expect(s.lines[0]!.base).toBe(40);
    expect(s.lines[0]!.share).toBeNull();
    expect(s.lines[1]!.state).toBe('pending');
  });

  it('charges consumption × unit price and splits what is not covered equally', () => {
    // 100 billed, readings cover 40 + 30 = 70 at 1/unit, 30 left: 15 each.
    const s = splitBill(
      bill({ total: 100, unitPrice: 1, participants: [person(OWNER, 40), person(2, 30)] }),
      OWNER,
      true,
    );
    expect(s.readingsComplete).toBe(true);
    expect(s.remainder).toBe(30);
    expect(s.lines.map((l) => [l.base, l.extra, l.share])).toEqual([
      [40, 15, 55],
      [30, 15, 45],
    ]);
    expect(s.lines[1]!.due).toBe(45);
    const sum = s.lines.reduce((a, l) => a + l.share!, 0);
    expect(sum).toBe(100);
  });

  it('shares a surplus too, so shares still add up to the bill', () => {
    const s = splitBill(
      bill({ total: 90, unitPrice: 1, participants: [person(OWNER, 60), person(2, 40)] }),
      OWNER,
      true,
    );
    expect(s.remainder).toBe(-10);
    expect(s.lines.map((l) => l.share)).toEqual([55, 35]);
  });

  it('derives the unit price from the billed consumption', () => {
    const s = splitBill(
      bill({ total: 123.45, consumption: 150, participants: [person(OWNER, 100), person(2, 50)] }),
      OWNER,
      true,
    );
    expect(s.unitPrice).toBeCloseTo(0.823);
    expect(s.lines[0]!.share! + s.lines[1]!.share!).toBeCloseTo(123.45, 10);
  });
});

describe('splitUtility: carry-over', () => {
  it('subtracts an overpayment from the next bill and adds a shortfall', () => {
    const participants = [person(OWNER), person(2)];
    const bills = [
      bill({ id: 1, total: 100, participants, payments: new Map([[2, 60]]) }), // owed 50, +10
      bill({ id: 2, total: 100, participants, payments: new Map([[2, 30]]) }), // owed 40, −10
      bill({ id: 3, total: 100, participants }), // owed 50 + 10
    ];
    const splits = splitUtility(bills, OWNER, false);
    const line = (id: number) => splits.get(id)!.lines[1]!;
    expect(line(1).state).toBe('overpaid');
    expect(line(1).difference).toBe(10);
    expect(line(2).carry).toBe(10);
    expect(line(2).due).toBe(40);
    expect(line(2).state).toBe('underpaid');
    expect(line(2).difference).toBe(-10);
    expect(line(3).carry).toBe(-10);
    expect(line(3).due).toBe(60);
  });

  it('does not carry anything from a bill without a recorded payment', () => {
    const participants = [person(OWNER), person(2)];
    const splits = splitUtility(
      [bill({ id: 1, participants }), bill({ id: 2, participants })],
      OWNER,
      false,
    );
    expect(splits.get(2)!.lines[1]!.carry).toBe(0);
    expect(splits.get(2)!.lines[1]!.due).toBe(50);
  });

  it('counts a credit that covers the whole share as paid', () => {
    const participants = [person(OWNER), person(2)];
    const splits = splitUtility(
      [
        bill({ id: 1, participants, payments: new Map([[2, 120]]) }), // +70
        bill({ id: 2, participants, providerPaid: true }), // owes 50 − 70 → nothing
        bill({ id: 3, participants }), // the credit is used once: 20 left
      ],
      OWNER,
      false,
    );
    const second = splits.get(2)!;
    expect(second.lines[1]!.due).toBe(-20);
    expect(second.lines[1]!.state).toBe('paid');
    expect(second.status).toBe('paid');
    expect(splits.get(3)!.lines[1]!.carry).toBe(20);
    expect(splits.get(3)!.lines[1]!.due).toBe(30);
  });
});
