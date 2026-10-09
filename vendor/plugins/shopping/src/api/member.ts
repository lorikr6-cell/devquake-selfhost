import { api } from '../lib/api';
import { removeMember } from '../lib/mutations';
import { id } from '../lib/validate';

// DELETE /api/lists/:id/members/:userId: the owner removes a member, or a member leaves.
export const DELETE = api(async ({ params, db, user }) => {
  await removeMember(db, id(params.id), user, id(params.userId));
});
