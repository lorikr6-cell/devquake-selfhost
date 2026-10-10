import { api, mine } from '../lib/api';
import { HttpError } from '../lib/http';
import { removeStaff } from '../lib/team-data';

// POST /api/team/leave: a member of the team leaves the shop (its owner cannot).
export const POST = api('overview', async ({ db, store, roles, user }) => {
  if (roles.includes('owner')) throw new HttpError(409, 'ownShop');
  await removeStaff(db, mine(store).id, user.id);
});
