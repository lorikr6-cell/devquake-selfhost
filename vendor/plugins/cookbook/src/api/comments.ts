import { api } from '../lib/api';
import { addComment } from '../lib/data';
import { LIMITS } from '../lib/recipe';
import { id, longOptionalText, readBody } from '../lib/validate';
import { HttpError } from '../lib/http';

// POST /api/recipes/:id/comments { body }: a comment on a public recipe. Its author gets a
// notification and finds it in their messages (scheduled hook, ADR 0037).
export const POST = api(async ({ request, params, db, user }) => {
  const body = longOptionalText((await readBody(request)).body, 'comment', LIMITS.comment);
  if (!body) throw new HttpError(400, 'required', { field: 'comment' });
  return { id: await addComment(db, id(params.id), user, body) };
});
