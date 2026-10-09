import { api } from '../lib/api';
import { removeMember, renameGuest } from '../lib/data';
import { LIMITS } from '../lib/model';
import { id, readBody, requiredText } from '../lib/validate';

// PATCH /api/groups/:id/members/:memberId { name }: the owner renames someone without an account.
export const PATCH = api(async ({ request, params, db, user }) => {
  const name = requiredText((await readBody(request)).name, 'memberName', LIMITS.memberName);
  await renameGuest(db, id(params.id), id(params.memberId), user.id, name);
});

// DELETE /api/groups/:id/members/:memberId: the owner removes a member, or a member leaves.
export const DELETE = api(async ({ params, db, user }) => {
  await removeMember(db, id(params.id), id(params.memberId), user.id);
});
