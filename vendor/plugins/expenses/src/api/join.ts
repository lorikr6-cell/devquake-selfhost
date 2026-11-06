import { api } from '../lib/api';
import { joinByInvite, membership } from '../lib/data';
import { HttpError } from '../lib/http';
import { INVITE_CODE_PATTERN } from '../lib/model';
import { memberName, notifyMembers } from '../lib/notify';
import { readBody } from '../lib/validate';

// POST /api/join { code }: join the group behind an invite code. Open to every signed-in DevQuake
// member (signedInRoutes): whoever joins through a member's invite gets the app free (ADR 0043).
// The group's owner is told (ADR 0084).
export const POST = api(async ({ request, db, user, grantInvitedAccess, push }) => {
  const body = await readBody(request);
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!INVITE_CODE_PATTERN.test(code)) throw new HttpError(400, 'inviteCode');
  const joined = await joinByInvite(db, code, user);
  if (joined.inviter !== null) await grantInvitedAccess?.(joined.inviter).catch(() => false);
  if (joined.isNew) {
    const me = await membership(db, joined.groupId, user.id);
    const [owner] = await db.query<{ id: number }>(
      "SELECT id FROM group_members WHERE group_id = ? AND role = 'owner' AND left_at IS NULL",
      [joined.groupId],
    );
    if (me && owner) {
      await notifyMembers(
        { db, push, groupId: joined.groupId, actorMemberId: me.memberId },
        [Number(owner.id)],
        'member_joined',
        [await memberName(db, me.memberId)],
        `group:${joined.groupId}`,
      );
    }
  }
  return { id: joined.groupId };
});
