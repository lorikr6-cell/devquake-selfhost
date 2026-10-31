import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { setSocialWorker } from '../lib/social-data';
import { id, readBody } from '../lib/validate';

// PUT /api/orgs/:id/staff/:staffId/social { on }: the "social worker" tick (organisers).
export const PUT = api(async ({ request, params, db, user }) => {
  const { on } = await readBody(request);
  if (typeof on !== 'boolean') throw new HttpError(400, 'invalidRequest');
  await setSocialWorker(db, id(params.id), user.id, id(params.staffId), on);
});
