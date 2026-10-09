import { api } from '../lib/api';
import { addReferralMember } from '../lib/mutations';
import { id, readBody } from '../lib/validate';

// POST /api/lists/:id/members { userId }: the owner adds someone from their referral network.
export const POST = api(async ({ request, params, db, user, people }) => {
  const body = await readBody(request);
  return addReferralMember(db, id(params.id), user, people, id(body.userId));
});
