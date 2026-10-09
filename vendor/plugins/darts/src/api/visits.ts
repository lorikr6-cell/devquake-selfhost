import { api, keepSignedIn } from '../lib/api';
import { addVisit, undoVisit } from '../lib/data/games';
import { HttpError } from '../lib/http';
import { darts, id, readBody } from '../lib/validate';

// POST /api/games/:id/visits { darts: ["T20", "1", "D20"], seq }: the signed-in player's visit.
// seq = the number of visits the screen knew about, so a visit is never counted twice.
export const POST = api(async ({ request, params, db, user, session }) => {
  const body = await readBody(request);
  const seq = Number(body.seq);
  if (!Number.isInteger(seq) || seq < 0) throw new HttpError(400, 'invalidRequest');
  await addVisit(db, id(params.id), user.id, darts(body.darts), seq);
  await keepSignedIn(session);
});

// DELETE /api/games/:id/visits: undo the player's own last visit.
export const DELETE = api(async ({ params, db, user }) => {
  await undoVisit(db, id(params.id), user.id);
});
