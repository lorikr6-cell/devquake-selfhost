import { api } from '../lib/api';
import { deleteComment } from '../lib/data';
import { id } from '../lib/validate';

// DELETE /api/groups/:id/comments/:commentId: the author or the owner removes a comment.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteComment(db, id(params.id), id(params.commentId), user.id);
});
