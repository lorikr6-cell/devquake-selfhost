import { api } from '../lib/api';
import { deleteComment } from '../lib/data';
import { id } from '../lib/validate';

// DELETE /api/sets/:id/comments/:commentId: its writer or the meal's owner.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteComment(db, id(params.id), id(params.commentId), user.id);
});
