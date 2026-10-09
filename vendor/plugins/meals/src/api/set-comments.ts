import { api } from '../lib/api';
import { addComment } from '../lib/data';
import { HttpError } from '../lib/http';
import { LIMITS } from '../lib/plan';
import { id, readBody } from '../lib/validate';

// POST /api/sets/:id/comments { body }: a comment on a public meal; its owner is told
// (scheduled hook, ADR 0037).
export const POST = api(async ({ request, params, db, user }) => {
  const raw = (await readBody(request)).body;
  const body = typeof raw === 'string' ? raw.replace(/\r\n?/g, '\n').trim() : '';
  if (!body) throw new HttpError(400, 'required', { field: 'comment' });
  if (body.length > LIMITS.comment)
    throw new HttpError(400, 'tooLong', { field: 'comment', max: LIMITS.comment });
  return { id: await addComment(db, id(params.id), user, body) };
});
