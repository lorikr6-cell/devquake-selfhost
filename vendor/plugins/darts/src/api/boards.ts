import { api } from '../lib/api';
import { addBoard } from '../lib/data/tournaments';
import { id } from '../lib/validate';

// POST /api/tournaments/:id/boards: the organiser adds a board (with a new code).
export const POST = api(async ({ params, db, user }) => {
  await addBoard(db, id(params.id), user.id);
});
