import { api } from '../lib/api';
import { addReferralMember } from '../lib/data';
import { todayIn } from '../lib/dates';
import { id, readBody } from '../lib/validate';

// POST /api/utilities/:id/members { userId }: the owner adds someone from their referrals.
// They share the bills from this month on.
export const POST = api(async ({ request, params, db, user, people, timeZone }) => {
  const body = await readBody(request);
  return addReferralMember(
    db,
    id(params.id),
    user,
    people,
    id(body.userId),
    todayIn(timeZone).slice(0, 7),
  );
});
