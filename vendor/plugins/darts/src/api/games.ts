import { api } from '../lib/api';
import { createGame } from '../lib/data/games';
import { getDrill } from '../lib/data/drills';
import { requireProfile } from '../lib/data/profiles';
import { HttpError } from '../lib/http';
import { gameChoice, id, readBody } from '../lib/validate';

// POST /api/games { mode, type, options } or { mode: "practice", drillId }: a new game.
// Practice starts at once; a casual game waits for players (join code).
export const POST = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  const profile = await requireProfile(db, user.id);
  if (body.mode !== 'practice' && body.mode !== 'casual') {
    throw new HttpError(400, 'invalidRequest');
  }
  if (body.drillId !== undefined && body.drillId !== null) {
    const drill = await getDrill(db, id(body.drillId), user.id);
    const gameId = await createGame(db, user, profile, {
      mode: 'practice',
      type: drill.type,
      options: drill.options,
      drillId: drill.id,
    });
    return Response.json({ id: gameId }, { status: 201 });
  }
  const { type, options } = gameChoice(body, body.mode);
  const gameId = await createGame(db, user, profile, { mode: body.mode, type, options });
  return Response.json({ id: gameId }, { status: 201 });
});
