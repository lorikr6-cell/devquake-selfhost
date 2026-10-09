import { api } from '../lib/api';
import { removeTournamentPlayer, updateTournamentPlayer } from '../lib/data/tournaments';
import { id, readBody } from '../lib/validate';

// PATCH /api/tournaments/:id/players/:playerId { paid?, boardId? }: the organiser marks the fee
// as paid or moves the player to another board.
export const PATCH = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await updateTournamentPlayer(db, id(params.id), user.id, id(params.playerId), {
    paid: typeof body.paid === 'boolean' ? body.paid : undefined,
    boardId: body.boardId === undefined ? undefined : id(body.boardId),
  });
});

// DELETE /api/tournaments/:id/players/:playerId: before the first round, the organiser removes
// a player or a player leaves.
export const DELETE = api(async ({ params, db, user }) => {
  await removeTournamentPlayer(db, id(params.id), user.id, id(params.playerId));
});
