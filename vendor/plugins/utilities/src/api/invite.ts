import { api } from '../lib/api';
import { activeInvite, requireOwner, rotateInvite } from '../lib/data';
import { id } from '../lib/validate';

// GET /api/utilities/:id/invite: the active invite code (owner only).
export const GET = api(async ({ params, db, user }) => {
  const utilityId = id(params.id);
  await requireOwner(db, utilityId, user.id);
  return { code: await activeInvite(db, utilityId, user.id) };
});

// POST /api/utilities/:id/invite: a new code; the old link stops working.
export const POST = api(async ({ params, db, user }) => {
  const utilityId = id(params.id);
  await requireOwner(db, utilityId, user.id);
  return { code: await rotateInvite(db, utilityId, user.id) };
});
