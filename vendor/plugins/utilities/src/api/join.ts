import { api } from '../lib/api';
import { hasCompleteProfile, joinByInvite } from '../lib/data';
import { todayIn } from '../lib/dates';
import { HttpError } from '../lib/http';
import { INVITE_CODE_PATTERN } from '../lib/model';
import { readBody } from '../lib/validate';

// POST /api/join { code }: join the utility behind an invite code (bills from this month on).
export const POST = api(async ({ request, db, user, timeZone }) => {
  const body = await readBody(request);
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!INVITE_CODE_PATTERN.test(code)) throw new HttpError(400, 'inviteCode');
  if (!(await hasCompleteProfile(db, user.id))) throw new HttpError(400, 'profileRequired');
  return { id: await joinByInvite(db, code, user, todayIn(timeZone).slice(0, 7)) };
});
