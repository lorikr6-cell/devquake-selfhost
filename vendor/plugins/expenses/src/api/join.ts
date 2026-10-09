import { api } from '../lib/api';
import { joinByInvite } from '../lib/data';
import { HttpError } from '../lib/http';
import { INVITE_CODE_PATTERN } from '../lib/model';
import { readBody } from '../lib/validate';

// POST /api/join { code }: join the group behind an invite code. Open to every signed-in DevQuake
// member (signedInRoutes): whoever joins through a member's invite gets the app free (ADR 0043).
export const POST = api(async ({ request, db, user, grantInvitedAccess }) => {
  const body = await readBody(request);
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!INVITE_CODE_PATTERN.test(code)) throw new HttpError(400, 'inviteCode');
  const joined = await joinByInvite(db, code, user);
  if (joined.inviter !== null) await grantInvitedAccess?.(joined.inviter).catch(() => false);
  return { id: joined.groupId };
});
