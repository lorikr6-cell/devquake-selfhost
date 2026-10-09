import { api } from '../lib/api';
import { addAccountMember, addGuest } from '../lib/data';
import { HttpError } from '../lib/http';
import { LIMITS } from '../lib/model';
import { id, readBody, requiredText } from '../lib/validate';

// POST /api/groups/:id/members: the owner adds someone without an account { name }, or someone
// from their DevQuake referrals { userId } (only people in their referral network).
export const POST = api(async ({ request, params, db, user, people }) => {
  const groupId = id(params.id);
  const body = await readBody(request);
  if (body.userId === undefined) {
    await addGuest(db, groupId, user.id, requiredText(body.name, 'memberName', LIMITS.memberName));
    return;
  }
  const userId = id(body.userId);
  const friend = ((await people?.referrals().catch(() => [])) ?? []).find((p) => p.id === userId);
  if (!friend) throw new HttpError(404, 'notAFriend');
  await addAccountMember(db, groupId, user, friend);
});
