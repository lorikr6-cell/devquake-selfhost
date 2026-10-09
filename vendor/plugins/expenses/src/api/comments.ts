import { api } from '../lib/api';
import { addComment } from '../lib/data';
import { LIMITS } from '../lib/model';
import { id, longOptionalText, readBody } from '../lib/validate';
import { HttpError } from '../lib/http';

// POST /api/groups/:id/expenses/:expenseId/comments { body }
export const POST = api(async ({ request, params, db, user }) => {
  const body = longOptionalText((await readBody(request)).body, 'comment', LIMITS.comment);
  if (!body) throw new HttpError(400, 'required', { field: 'comment' });
  await addComment(db, id(params.id), id(params.expenseId), user.id, body);
});
