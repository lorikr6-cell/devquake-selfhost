import { api } from '../lib/api';
import { activeInvite, requireOwner, rotateInvite } from '../lib/data';
import { id } from '../lib/validate';

// GET /api/lists/:id/invite: the active invite code (owner only).
export const GET = api(async ({ params, db, user }) => {
  const listId = id(params.id);
  await requireOwner(db, listId, user.id);
  return { code: await activeInvite(db, listId, user.id) };
});

// POST /api/lists/:id/invite: a new code; the old link stops working.
export const POST = api(async ({ params, db, user }) => {
  const listId = id(params.id);
  await requireOwner(db, listId, user.id);
  return { code: await rotateInvite(db, listId, user.id) };
});
