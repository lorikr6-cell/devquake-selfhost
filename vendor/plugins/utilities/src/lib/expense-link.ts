// A bill as a shared expense in the Shared expenses app (link point expense.add, ADR 0035 and
// ADR 0055): pure, unit-tested (expense-link.test.ts).

export interface ExpenseGroup {
  id: number;
  name: string;
  currency: string;
  /** Platform user ids of the group's members with an account. */
  userIds: number[];
}

/** Groups a bill fits in: the utility's currency, and everyone sharing the bill is in them. */
export function fittingGroups(
  groups: ExpenseGroup[],
  currency: string,
  userIds: number[],
): ExpenseGroup[] {
  return groups.filter(
    (g) => g.currency === currency && userIds.every((id) => g.userIds.includes(id)),
  );
}

/**
 * What Shared expenses gets: the bill paid by the owner (the caller), with each participant's
 * share as computed here, exactly. Null while a share is not known yet (meter readings missing).
 */
export function billAsExpense(input: {
  groupId: number;
  billId: number;
  title: string;
  total: number;
  currency: string;
  /** The day it was due, else the first day of its month ("YYYY-MM"). */
  dueOn: string | null;
  period: string;
  lines: Array<{ userId: number; share: number | null }>;
}) {
  if (input.lines.length === 0 || input.lines.some((l) => l.share === null)) return null;
  return {
    groupId: input.groupId,
    title: input.title.slice(0, 120),
    amount: input.total,
    currency: input.currency,
    spentOn: input.dueOn ?? `${input.period}-01`,
    category: 'utilities',
    source: `utilities:bill:${input.billId}`,
    split: {
      mode: 'exact' as const,
      shares: input.lines.map((l) => ({ userId: l.userId, amount: l.share! })),
    },
  };
}
