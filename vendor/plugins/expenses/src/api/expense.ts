import { api } from '../lib/api';
import { deleteExpense, expenseById, groupById, requireMember, updateExpense } from '../lib/data';
import { HttpError } from '../lib/http';
import { amountText, expenseMembers, memberName, notifyMembers } from '../lib/notify';
import { expenseInput, id, readBody } from '../lib/validate';

// PATCH /api/groups/:id/expenses/:expenseId: a member corrects an expense. Whoever was or is in
// it (payer and split, before and after) is told (ADR 0084).
export const PATCH = api(async ({ request, params, db, user, push }) => {
  const groupId = id(params.id);
  const expenseId = id(params.expenseId);
  const input = expenseInput(await readBody(request));
  const me = await requireMember(db, groupId, user.id);
  const before = await expenseMembers(db, expenseId);
  await updateExpense(db, groupId, expenseId, user.id, input);
  const group = await groupById(db, groupId);
  await notifyMembers(
    { db, push, groupId, actorMemberId: me.memberId },
    [...before, ...(await expenseMembers(db, expenseId))],
    'expense_changed',
    [
      await memberName(db, me.memberId),
      `${input.title} · ${amountText(input.amount, group!.currency)}`,
    ],
    `expense:${groupId}:${expenseId}`,
  );
});

// DELETE /api/groups/:id/expenses/:expenseId: the people who were in it are told.
export const DELETE = api(async ({ params, db, user, push }) => {
  const groupId = id(params.id);
  const expenseId = id(params.expenseId);
  const me = await requireMember(db, groupId, user.id);
  const expense = await expenseById(db, groupId, expenseId);
  if (!expense) throw new HttpError(404, 'expenseNotFound');
  const involved = await expenseMembers(db, expenseId);
  await deleteExpense(db, groupId, expenseId, user.id);
  const group = await groupById(db, groupId);
  await notifyMembers(
    { db, push, groupId, actorMemberId: me.memberId },
    involved,
    'expense_deleted',
    [
      await memberName(db, me.memberId),
      `${expense.title} · ${amountText(expense.amount, group!.currency)}`,
    ],
    `group:${groupId}`,
  );
});
