// A shopping list as a shared expense in the Shared expenses app (link point expense.add,
// ADR 0035 and ADR 0055): pure, unit-tested (expense-link.test.ts).

export interface ExpenseGroup {
  id: number;
  name: string;
  currency: string;
  /** Platform user ids of the group's members with an account. */
  userIds: number[];
}

/** Groups a list fits in: the list's currency, and everyone on the list is in them. */
export function fittingGroups(
  groups: ExpenseGroup[],
  currency: string,
  userIds: number[],
): ExpenseGroup[] {
  return groups.filter(
    (g) => g.currency === currency && userIds.every((id) => g.userIds.includes(id)),
  );
}

/** What was bought: ticked items with a price (price × quantity, 1 without a quantity). */
export function boughtTotal(
  items: Array<{ done: boolean; price: number | null; quantity: number | null }>,
): number {
  const cents = items
    .filter((i) => i.done && i.price !== null)
    .reduce((sum, i) => sum + Math.round(i.price! * (i.quantity ?? 1) * 100), 0);
  return cents / 100;
}

/**
 * What Shared expenses gets: the bought total paid by the caller, split equally between
 * everyone on the list. Null when nothing priced was bought yet.
 */
export function listAsExpense(input: {
  groupId: number;
  listId: number;
  name: string;
  shopDate: string;
  currency: string;
  total: number;
  userIds: number[];
}) {
  if (input.total <= 0 || input.userIds.length === 0) return null;
  return {
    groupId: input.groupId,
    title: input.name.slice(0, 120),
    amount: input.total,
    currency: input.currency,
    spentOn: input.shopDate,
    category: 'groceries',
    source: `shopping:list:${input.listId}`,
    split: { mode: 'equal' as const, userIds: input.userIds },
  };
}
