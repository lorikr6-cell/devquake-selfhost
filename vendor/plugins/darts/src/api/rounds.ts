import { api } from '../lib/api';
import { startRound, suggestRound } from '../lib/data/tournaments';
import { HttpError } from '../lib/http';
import { readBody, id } from '../lib/validate';

// GET /api/tournaments/:id/rounds: the organiser's suggested pairs for the next round.
export const GET = api(async ({ params, db, user }) => suggestRound(db, id(params.id), user.id));

// POST /api/tournaments/:id/rounds { pairs: [[a, b], ...], bye }: start the next round with
// these pairs (the suggestion, maybe with players swapped).
export const POST = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  if (!Array.isArray(body.pairs)) throw new HttpError(400, 'pairing');
  const pairs = body.pairs.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new HttpError(400, 'pairing');
    return [id(pair[0]), id(pair[1])] as [number, number];
  });
  const bye = body.bye === null || body.bye === undefined ? null : id(body.bye);
  await startRound(db, id(params.id), user.id, { pairs, bye });
});
