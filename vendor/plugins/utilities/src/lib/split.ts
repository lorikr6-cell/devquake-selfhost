// How a bill is shared: pure functions, unit-tested (split.test.ts). All money is computed in
// whole cents so shares always add up to the bill exactly.
//
// Rules:
// - Meter bills (utility.meterRequired): each participant pays consumption × unit price. Once
//   everyone has sent a reading, whatever the readings do not cover (common areas, losses, a
//   fixed fee; or a surplus when the meters add up to more than was billed) is split equally
//   between everyone, the owner included. Until then the bill waits for readings.
// - Other bills: split equally between the participants.
// - Cents that do not divide evenly go to the owner.
// - The unit price is the bill's own (from the PDF or typed); otherwise total ÷ billed
//   consumption; otherwise (meter bills) total ÷ the sum of the readings.
// - Carry-over: what a participant paid more or less than they owed on earlier bills of the
//   same utility (only bills where the owner recorded their payment) is subtracted from or
//   added to what they owe now.

export interface SplitParticipant {
  userId: number;
  displayName: string;
  /** Their reading's consumption; null when not sent yet. */
  consumption: number | null;
}

export interface SplitBill {
  id: number;
  total: number;
  /** Consumption on the provider's bill. */
  consumption: number | null;
  /** Unit price on the provider's bill. */
  unitPrice: number | null;
  providerPaid: boolean;
  participants: SplitParticipant[];
  /** Amounts the owner recorded as received, by user id. */
  payments: Map<number, number>;
}

export type LineState = 'owner' | 'pending' | 'unpaid' | 'paid' | 'overpaid' | 'underpaid';

export interface ShareLine {
  userId: number;
  displayName: string;
  isOwner: boolean;
  consumption: number | null;
  /** consumption × unit price (meter bills). */
  base: number | null;
  /** Their part of what the readings did not cover (meter bills, once all readings are in). */
  extra: number | null;
  /** Their share of the bill; null while it cannot be computed yet. */
  share: number | null;
  /** Balance from earlier bills: positive = paid too much before (credit), negative = debt. */
  carry: number;
  /** What they owe the owner for this bill: share − carry (null for the owner). */
  due: number | null;
  /** What the owner recorded as received; null when nothing was recorded. */
  paid: number | null;
  /** paid − due (positive = paid too much, carried to the next bill). */
  difference: number | null;
  state: LineState;
}

export type BillStatus = 'paid' | 'awaiting' | 'open';

export interface BillSplit {
  billId: number;
  unitPrice: number | null;
  meterMode: boolean;
  /** All readings are in (always true for equal splits). */
  readingsComplete: boolean;
  missingReadings: number;
  /** What the readings did not cover (meter bills, all readings in); may be negative. */
  remainder: number | null;
  lines: ShareLine[];
  /** Still owed to the owner (sum of each participant's unpaid part). */
  outstanding: number;
  /** paid = green check; awaiting = readings missing; open = payments do not cover it (warning). */
  status: BillStatus;
}

const cents = (amount: number) => Math.round(amount * 100);
const money = (c: number) => c / 100;
const EPSILON = 0.005;

/** The unit price to use for the bill (see the rules above). */
export function effectiveUnitPrice(bill: SplitBill, meterMode: boolean): number | null {
  if (bill.unitPrice !== null && bill.unitPrice > 0) return bill.unitPrice;
  if (bill.consumption !== null && bill.consumption > 0) return bill.total / bill.consumption;
  if (meterMode) {
    const readings = bill.participants.map((p) => p.consumption);
    if (readings.every((c) => c !== null)) {
      const sum = readings.reduce<number>((a, c) => a + c!, 0);
      if (sum > 0) return bill.total / sum;
    }
  }
  return null;
}

/**
 * Splits `amountCents` into `count` parts that add up exactly; the remainder cents go to the
 * part at `ownerIndex` (or the first part when the owner is not among them).
 */
export function distributeCents(amountCents: number, count: number, ownerIndex: number): number[] {
  if (count <= 0) return [];
  const each = Math.trunc(amountCents / count);
  const parts = Array.from({ length: count }, () => each);
  parts[ownerIndex >= 0 && ownerIndex < count ? ownerIndex : 0]! += amountCents - each * count;
  return parts;
}

function lineState(line: Omit<ShareLine, 'state'>): LineState {
  if (line.isOwner) return 'owner';
  if (line.due === null) return 'pending';
  if (line.paid === null) return line.due <= EPSILON ? 'paid' : 'unpaid';
  const diff = line.paid - line.due;
  if (diff > EPSILON) return 'overpaid';
  if (diff < -EPSILON) return 'underpaid';
  return 'paid';
}

/** Splits one bill; `carry` holds each participant's balance from earlier bills. */
export function splitBill(
  bill: SplitBill,
  ownerId: number,
  meterMode: boolean,
  carry: Map<number, number> = new Map(),
): BillSplit {
  const people = bill.participants;
  const ownerIndex = people.findIndex((p) => p.userId === ownerId);
  const unitPrice = effectiveUnitPrice(bill, meterMode);
  const missingReadings = meterMode ? people.filter((p) => p.consumption === null).length : 0;
  const readingsComplete = missingReadings === 0;
  const totalCents = cents(bill.total);

  const base: (number | null)[] = people.map(() => null);
  const extra: (number | null)[] = people.map(() => null);
  const share: (number | null)[] = people.map(() => null);
  let remainder: number | null = null;

  if (meterMode) {
    people.forEach((p, i) => {
      if (p.consumption !== null && unitPrice !== null) base[i] = cents(p.consumption * unitPrice);
    });
    if (readingsComplete && people.length > 0 && base.every((b) => b !== null)) {
      const rest = totalCents - base.reduce<number>((a, b) => a + b!, 0);
      remainder = money(rest);
      const parts = distributeCents(rest, people.length, ownerIndex);
      people.forEach((_, i) => {
        extra[i] = parts[i]!;
        share[i] = base[i]! + parts[i]!;
      });
    }
  } else {
    const parts = distributeCents(totalCents, people.length, ownerIndex);
    people.forEach((_, i) => (share[i] = parts[i]!));
  }

  const lines: ShareLine[] = people.map((p, i) => {
    const isOwner = p.userId === ownerId;
    const c = isOwner ? 0 : (carry.get(p.userId) ?? 0);
    const s = share[i] === null ? null : money(share[i]!);
    const due = isOwner || s === null ? null : money(cents(s) - cents(c));
    const recorded = bill.payments.get(p.userId);
    const paid = isOwner || recorded === undefined ? null : recorded;
    const line = {
      userId: p.userId,
      displayName: p.displayName,
      isOwner,
      consumption: p.consumption,
      base: base[i] === null ? null : money(base[i]!),
      extra: extra[i] === null ? null : money(extra[i]!),
      share: s,
      carry: c,
      due,
      paid,
      difference: due !== null && paid !== null ? money(cents(paid) - cents(due)) : null,
    };
    return { ...line, state: lineState(line) };
  });

  const outstanding = money(
    lines.reduce((sum, l) => {
      if (l.isOwner || l.due === null) return sum;
      return sum + Math.max(0, cents(l.due) - cents(l.paid ?? 0));
    }, 0),
  );
  const others = lines.filter((l) => !l.isOwner);
  const covered = others.every((l) => l.state === 'paid' || l.state === 'overpaid');
  const status: BillStatus = !readingsComplete
    ? 'awaiting'
    : covered && bill.providerPaid
      ? 'paid'
      : 'open';

  return {
    billId: bill.id,
    unitPrice,
    meterMode,
    readingsComplete,
    missingReadings,
    remainder,
    lines,
    outstanding,
    status,
  };
}

/**
 * Splits every bill of one utility, oldest first, carrying each participant's balance from bill
 * to bill: a bill adds (paid − share) to the balance once the owner recorded that person's
 * payment on it. Returns the splits by bill id.
 */
export function splitUtility(
  bills: SplitBill[],
  ownerId: number,
  meterMode: boolean,
): Map<number, BillSplit> {
  const balance = new Map<number, number>();
  const result = new Map<number, BillSplit>();
  for (const bill of bills) {
    const split = splitBill(bill, ownerId, meterMode, balance);
    result.set(bill.id, split);
    for (const line of split.lines) {
      if (line.isOwner || line.share === null || line.due === null) continue;
      // A share fully covered by earlier credit counts as settled with nothing paid, so the
      // credit is used once.
      const paid = line.paid ?? (line.due <= EPSILON ? 0 : null);
      if (paid === null) continue;
      const before = balance.get(line.userId) ?? 0;
      balance.set(line.userId, money(cents(before) + cents(paid) - cents(line.share)));
    }
  }
  return result;
}
