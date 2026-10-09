import { api } from '../lib/api';
import { removeMember, setMemberViewOnly } from '../lib/data';
import { todayIn } from '../lib/dates';
import { bool, id, readBody } from '../lib/validate';

// DELETE /api/utilities/:id/members/:userId: the owner removes a member, or a member leaves.
export const DELETE = api(async ({ params, db, user }) => {
  await removeMember(db, id(params.id), user, id(params.userId));
});

// PATCH /api/utilities/:id/members/:userId { viewOnly }: the manager lets a member only see the
// bills (a family member who pays nothing), or share them again from this month on.
export const PATCH = api(async ({ request, params, db, user, timeZone }) => {
  const body = await readBody(request);
  await setMemberViewOnly(
    db,
    id(params.id),
    user,
    id(params.userId),
    bool(body.viewOnly),
    todayIn(timeZone).slice(0, 7),
  );
});
