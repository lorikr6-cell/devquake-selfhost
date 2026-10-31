import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { assignSocialWorker, moveInService } from '../lib/social-data';
import { id, readBody } from '../lib/validate';

// PUT /api/orgs/:id/social/people/:personId { to: 'admit' | 'wait' | 'end' } in or out of the
// service (admit only when a place of their kind is free), or { socialWorker: userId | null }
// the social worker responsible for them.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const orgId = id(params.id);
  const personId = id(params.personId);
  if ('socialWorker' in body) {
    const w = body.socialWorker;
    await assignSocialWorker(db, orgId, user.id, personId, w === null || w === '' ? null : id(w));
    return;
  }
  const to = body.to;
  if (to !== 'admit' && to !== 'wait' && to !== 'end') throw new HttpError(400, 'invalidRequest');
  await moveInService(db, orgId, user.id, personId, to);
});
