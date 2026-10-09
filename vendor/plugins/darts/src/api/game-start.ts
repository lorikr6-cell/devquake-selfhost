import { api } from '../lib/api';
import { startGame } from '../lib/data/games';
import { id, readBody } from '../lib/validate';

// POST /api/games/:id/start { random?: boolean }: the owner starts a casual game.
export const POST = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await startGame(db, id(params.id), user.id, body.random === true);
});
