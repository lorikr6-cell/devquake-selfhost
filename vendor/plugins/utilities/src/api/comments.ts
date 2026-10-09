import { api } from '../lib/api';
import { addComment, commentsOf } from '../lib/data';
import { id, longText, readBody } from '../lib/validate';

// GET /api/bills/:id/comments. POST { body }: everyone on the utility may comment.
export const GET = api(async ({ params, db, user }) => ({
  comments: await commentsOf(db, id(params.id), user.id),
}));

export const POST = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const commentId = await addComment(db, id(params.id), user, longText(body.body, 'comment', 2000));
  return Response.json({ id: commentId }, { status: 201 });
});
