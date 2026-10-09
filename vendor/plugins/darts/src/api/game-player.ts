import { api } from '../lib/api';
import { removePlayer } from '../lib/data/games';
import { id } from '../lib/validate';

// DELETE /api/games/:id/players/:playerId: the owner removes a player, or a player leaves.
export const DELETE = api(async ({ params, db, user }) => {
  await removePlayer(db, id(params.id), user.id, id(params.playerId));
});
