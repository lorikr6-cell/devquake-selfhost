import { api } from '../lib/api';
import { joinByInvite } from '../lib/data';
import { HttpError } from '../lib/http';
import { INVITE_CODE_PATTERN } from '../lib/model';
import { readBody } from '../lib/validate';

// POST /api/join { code }: join the organisation behind an invitation, with its role. Open to
// every signed-in DevQuake member (signedInRoutes); the app is free for them (ADR 0043).
export const POST = api(async ({ request, db, user, grantInvitedAccess }) => {
  const body = await readBody(request);
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!INVITE_CODE_PATTERN.test(code)) throw new HttpError(404, 'inviteInvalid');
  const joined = await joinByInvite(db, code, user);
  if (joined.inviter !== null) await grantInvitedAccess?.(joined.inviter).catch(() => false);
  return { id: joined.orgId };
});
