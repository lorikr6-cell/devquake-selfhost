import { api } from '../lib/api';
import { deleteDrill } from '../lib/data/drills';
import { id } from '../lib/validate';

// DELETE /api/drills/:id: remove one of the player's drills.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteDrill(db, id(params.id), user.id);
});
