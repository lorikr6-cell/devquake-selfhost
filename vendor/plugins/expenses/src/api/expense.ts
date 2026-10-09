import { api } from '../lib/api';
import { deleteExpense, updateExpense } from '../lib/data';
import { expenseInput, id, readBody } from '../lib/validate';

// PATCH /api/groups/:id/expenses/:expenseId: a member corrects an expense.
export const PATCH = api(async ({ request, params, db, user }) => {
  await updateExpense(
    db,
    id(params.id),
    id(params.expenseId),
    user.id,
    expenseInput(await readBody(request)),
  );
});

// DELETE /api/groups/:id/expenses/:expenseId
export const DELETE = api(async ({ params, db, user }) => {
  await deleteExpense(db, id(params.id), id(params.expenseId), user.id);
});
