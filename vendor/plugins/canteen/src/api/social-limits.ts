import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { saveLimits } from '../lib/social-data';
import { id, readBody } from '../lib/validate';

const limit = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 9999) throw new HttpError(400, 'invalidRequest');
  return n;
};

// PUT /api/orgs/:id/social/limits { maxResidents, maxDelivery }: how many each kind takes
// (empty = no limit). Organisers.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await saveLimits(db, id(params.id), user.id, {
    maxResidents: limit(body.maxResidents),
    maxDelivery: limit(body.maxDelivery),
  });
});
