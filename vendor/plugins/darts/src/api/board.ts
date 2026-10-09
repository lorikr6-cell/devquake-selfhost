import { api } from '../lib/api';
import { deleteBoard, renameBoard } from '../lib/data/tournaments';
import { id, readBody, text } from '../lib/validate';

// PATCH /api/tournaments/:id/boards/:boardId { name }: rename a board.
export const PATCH = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await renameBoard(db, id(params.id), user.id, id(params.boardId), text(body.name, 'board', 40));
});

// DELETE /api/tournaments/:id/boards/:boardId: remove a board without a match on it.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteBoard(db, id(params.id), user.id, id(params.boardId));
});
