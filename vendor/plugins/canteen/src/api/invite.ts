import { api } from '../lib/api';
import { revokeInvite } from '../lib/data';
import { id } from '../lib/validate';

// DELETE /api/orgs/:id/invites/:inviteId: an organiser withdraws an unused link.
export const DELETE = api(async ({ params, db, user }) => {
  await revokeInvite(db, id(params.id), id(params.inviteId), user.id);
});
