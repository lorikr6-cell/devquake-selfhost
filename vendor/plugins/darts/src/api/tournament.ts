import { api } from '../lib/api';
import {
  deleteTournament,
  tournamentVersion,
  tournamentView,
  updateTournament,
} from '../lib/data/tournaments';
import { HttpError } from '../lib/http';
import { currency, id, money, percent, readBody, text } from '../lib/validate';

// GET /api/tournaments/:id?v=<version>: { changed } for the tournament screen's polling (the
// screen reloads its data when it changed). Organiser and players only.
export const GET = api(async ({ params, db, user, url }) => {
  const tournamentId = id(params.id);
  const version = await tournamentVersion(db, tournamentId);
  const view = version === null ? null : await tournamentView(db, tournamentId, user.id);
  if (!view) throw new HttpError(404, 'notFound');
  return { changed: url.searchParams.get('v') !== String(version), version };
});

// PATCH /api/tournaments/:id { name, fee, currency, organizerPct }: the organiser's settings
// (the fee and its split only before the first round).
export const PATCH = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await updateTournament(db, id(params.id), user.id, {
    name: text(body.name, 'tournamentName', 80),
    feeCents: money(body.fee),
    currency: currency(body.currency),
    organizerPct: percent(body.organizerPct),
  });
});

// DELETE /api/tournaments/:id: the organiser deletes the tournament and its matches.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteTournament(db, id(params.id), user.id);
});
