import { api } from '../lib/api';
import { newInvite } from '../lib/data';
import { id } from '../lib/validate';

// POST /api/groups/:id/invite: the owner makes a new invite code (the old link stops working).
export const POST = api(async ({ params, db, user }) => {
  return { code: await newInvite(db, id(params.id), user.id) };
});
