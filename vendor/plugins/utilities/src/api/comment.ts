import { api } from '../lib/api';
import { deleteComment } from '../lib/data';
import { id } from '../lib/validate';

// DELETE /api/bills/:id/comments/:commentId: the author, or the utility's owner.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteComment(db, id(params.id), id(params.commentId), user.id);
});
