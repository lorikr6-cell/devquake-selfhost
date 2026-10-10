import { api, mine } from '../lib/api';
import { revokeInvite } from '../lib/team-data';

// DELETE /api/team/invites/:id: the link stops working.
export const DELETE = api('team', async ({ params, db, store }) => {
  await revokeInvite(db, mine(store).id, params.id ?? '');
});
