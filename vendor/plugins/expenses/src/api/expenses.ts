import { api } from '../lib/api';
import { createExpense } from '../lib/data';
import { expenseInput, id, readBody } from '../lib/validate';

// POST /api/groups/:id/expenses: a member adds an expense (split in cents on the server).
export const POST = api(async ({ request, params, db, user }) => {
  const expenseId = await createExpense(
    db,
    id(params.id),
    user.id,
    expenseInput(await readBody(request)),
  );
  return { id: expenseId };
});
