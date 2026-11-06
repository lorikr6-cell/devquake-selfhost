import { api } from '../lib/api';
import { createExpense, groupById, requireMember } from '../lib/data';
import { amountText, expenseMembers, memberName, notifyMembers } from '../lib/notify';
import { expenseInput, id, readBody } from '../lib/validate';

// POST /api/groups/:id/expenses: a member adds an expense (split in cents on the server). Its
// payer and the people in its split are told on their phones (ADR 0084).
export const POST = api(async ({ request, params, db, user, push }) => {
  const groupId = id(params.id);
  const input = expenseInput(await readBody(request));
  const expenseId = await createExpense(db, groupId, user.id, input);
  const me = await requireMember(db, groupId, user.id);
  const group = await groupById(db, groupId);
  await notifyMembers(
    { db, push, groupId, actorMemberId: me.memberId },
    await expenseMembers(db, expenseId),
    'expense_added',
    [
      await memberName(db, me.memberId),
      `${input.title} · ${amountText(input.amount, group!.currency)}`,
    ],
    `expense:${groupId}:${expenseId}`,
  );
  return { id: expenseId };
});
