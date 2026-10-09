import { api } from '../lib/api';
import { newInvite, revokeInvite } from '../lib/data';
import { id } from '../lib/validate';

// POST /api/households/:id/invite: a new invite link (the old one stops working). Planners.
export const POST = api(async ({ params, db, user }) => ({
  code: await newInvite(db, id(params.id), user.id),
}));

export const DELETE = api(async ({ params, db, user }) => {
  await revokeInvite(db, id(params.id), user.id);
});
