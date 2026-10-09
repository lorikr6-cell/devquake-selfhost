import { api } from '../lib/api';
import { joinByInvite } from '../lib/data';
import { HttpError } from '../lib/http';
import { INVITE_CODE_PATTERN } from '../lib/plan';
import { readBody } from '../lib/validate';

// POST /api/join { code }: join the household behind an invite code (as a member).
export const POST = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!INVITE_CODE_PATTERN.test(code)) throw new HttpError(400, 'inviteCode');
  return { id: await joinByInvite(db, code, user) };
});
