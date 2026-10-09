import { api } from '../lib/api';
import { requireProfile } from '../lib/data/profiles';
import { createTournament } from '../lib/data/tournaments';
import { boardCount, currency, gameChoice, money, percent, readBody, text } from '../lib/validate';

// POST /api/tournaments { name, type, options, fee, currency, organizerPct, boards, play }:
// a new tournament with its boards (each with a code), open for players to join.
export const POST = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  const profile = await requireProfile(db, user.id);
  const { type, options } = gameChoice(body, 'tournament');
  const tournamentId = await createTournament(db, user, profile, {
    name: text(body.name, 'tournamentName', 80),
    type,
    options,
    feeCents: money(body.fee),
    currency: currency(body.currency),
    organizerPct: percent(body.organizerPct),
    boards: boardCount(body.boards),
    play: body.play === true,
  });
  return Response.json({ id: tournamentId }, { status: 201 });
});
