// How an expense is shared and how a group settles up: pure functions, unit-tested
// (split.test.ts). All money is computed in whole cents so the parts always add up exactly, as in
// Utilities' bill splits (ADR 0055).
//
// Split modes:
// - equal: the amount divided by the participants; the cents that do not divide go to the payer
//   (or the first participant when the payer does not take part).
// - shares: in proportion to each person's shares (2 for a couple, 1 for a single, …).
// - percent: in proportion to percentages that add up to 100.
// - exact: the typed amounts, which must add up to the expense.
// Proportional splits round down and give the remaining cents to the largest fractions (largest
// remainder), ties to the payer, then in the given order.

export type SplitMode = 'equal' | 'shares' | 'percent' | 'exact';

export interface SplitEntry {
  memberId: number;
  /** Shares, a percentage or an amount (ignored for equal splits). */
  value: number;
}

export type SplitError = 'noParticipants' | 'badValue' | 'percentTotal' | 'exactTotal';

export type SplitResult =
  | { ok: true; parts: Array<{ memberId: number; cents: number }> }
  | { ok: false; error: SplitError };

export const toCents = (amount: number) => Math.round(amount * 100);
export const fromCents = (cents: number) => cents / 100;

/** Splits `totalCents` in proportion to `weights` (all > 0); the parts add up to the total. */
export function proportional(totalCents: number, weights: number[], preferIndex = -1): number[] {
  const sum = weights.reduce((a, w) => a + w, 0);
  const exact = weights.map((w) => (totalCents * w) / sum);
  const parts = exact.map((x) => Math.floor(x));
  let left = totalCents - parts.reduce((a, p) => a + p, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort(
      (a, b) =>
        b.frac - a.frac || Number(b.i === preferIndex) - Number(a.i === preferIndex) || a.i - b.i,
    );
  for (const { i } of order) {
    if (left <= 0) break;
    parts[i]! += 1;
    left--;
  }
  return parts;
}

/** Splits an expense of `totalCents` paid by `payerId` between `entries`. */
export function splitExpense(
  totalCents: number,
  mode: SplitMode,
  entries: SplitEntry[],
  payerId: number,
): SplitResult {
  if (entries.length === 0) return { ok: false, error: 'noParticipants' };
  const ids = entries.map((e) => e.memberId);
  const payerIndex = ids.indexOf(payerId);
  const result = (cents: number[]) => ({
    ok: true as const,
    parts: ids.map((memberId, i) => ({ memberId, cents: cents[i]! })),
  });

  if (mode === 'equal') {
    const each = Math.trunc(totalCents / ids.length);
    const parts = ids.map(() => each);
    parts[payerIndex >= 0 ? payerIndex : 0]! += totalCents - each * ids.length;
    return result(parts);
  }

  const values = entries.map((e) => e.value);
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return { ok: false, error: 'badValue' };

  if (mode === 'exact') {
    const parts = values.map(toCents);
    if (parts.reduce((a, p) => a + p, 0) !== totalCents) return { ok: false, error: 'exactTotal' };
    return result(parts);
  }

  if (mode === 'percent' && Math.abs(values.reduce((a, v) => a + v, 0) - 100) > 0.001) {
    return { ok: false, error: 'percentTotal' };
  }
  // People with 0 shares or 0 % take part with nothing; at least one must have some.
  if (values.every((v) => v === 0)) return { ok: false, error: 'badValue' };
  return result(proportional(totalCents, values, payerIndex));
}

// --- Balances and settling up ----------------------------------------------------------------

export interface LedgerExpense {
  paidBy: number;
  amountCents: number;
  shares: Array<{ memberId: number; cents: number }>;
}

export interface LedgerPayment {
  from: number;
  to: number;
  amountCents: number;
}

/**
 * Each member's balance in cents: what they paid (expenses and payments sent) minus what they
 * owe (their shares and payments received). Positive = the group owes them; the balances of a
 * group always add up to 0.
 */
export function balances(
  memberIds: number[],
  expenses: LedgerExpense[],
  payments: LedgerPayment[],
): Map<number, number> {
  const balance = new Map<number, number>(memberIds.map((id) => [id, 0]));
  const add = (id: number, cents: number) => balance.set(id, (balance.get(id) ?? 0) + cents);
  for (const e of expenses) {
    add(e.paidBy, e.amountCents);
    for (const s of e.shares) add(s.memberId, -s.cents);
  }
  for (const p of payments) {
    add(p.from, p.amountCents);
    add(p.to, -p.amountCents);
  }
  return balance;
}

export interface Transfer {
  from: number;
  to: number;
  cents: number;
}

/**
 * Transfers that bring every balance to 0: the largest debt pays the largest credit, again and
 * again. At most (people with a balance − 1) transfers. Ties are broken by member id, so the plan
 * is the same on every page load.
 */
export function settleUp(balance: Map<number, number>): Transfer[] {
  const debtors = [...balance].filter(([, c]) => c < 0).map(([id, c]) => ({ id, left: -c }));
  const creditors = [...balance].filter(([, c]) => c > 0).map(([id, c]) => ({ id, left: c }));
  const byLeft = (a: { id: number; left: number }, b: { id: number; left: number }) =>
    b.left - a.left || a.id - b.id;
  const transfers: Transfer[] = [];
  while (debtors.length && creditors.length) {
    debtors.sort(byLeft);
    creditors.sort(byLeft);
    const d = debtors[0]!;
    const c = creditors[0]!;
    const cents = Math.min(d.left, c.left);
    transfers.push({ from: d.id, to: c.id, cents });
    d.left -= cents;
    c.left -= cents;
    if (d.left === 0) debtors.shift();
    if (c.left === 0) creditors.shift();
  }
  return transfers;
}
