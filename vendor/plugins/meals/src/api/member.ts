import { api } from '../lib/api';
import { removeMember, setMemberRole } from '../lib/data';
import { HttpError } from '../lib/http';
import { id, readBody } from '../lib/validate';

// PATCH /api/households/:id/members/:userId { role }: a planner changes a member's role.
export const PATCH = api(async ({ request, params, db, user }) => {
  const { role } = await readBody(request);
  if (role !== 'planner' && role !== 'member') throw new HttpError(400, 'invalidRequest');
  await setMemberRole(db, id(params.id), id(params.userId), user.id, role);
});

// DELETE /api/households/:id/members/:userId: a planner removes someone, or a member leaves.
export const DELETE = api(async ({ params, db, user }) => {
  await removeMember(db, id(params.id), id(params.userId), user.id);
});
