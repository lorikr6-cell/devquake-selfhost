import { api } from '../lib/api';
import { deleteComment } from '../lib/data';
import { id } from '../lib/validate';

// DELETE /api/recipes/:id/comments/:commentId: its writer or the recipe's author.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteComment(db, id(params.id), id(params.commentId), user.id);
});
