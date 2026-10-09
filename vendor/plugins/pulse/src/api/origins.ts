import { api, readJson } from '../lib/api';
import { addOrigin, listOrigins } from '../lib/data';
import { HttpError } from '../lib/http';
import { requireApp } from '../lib/own-app';
import { isLocalOrigin, normaliseOrigin } from '../lib/origins';

// POST /api/apps/:id/origins { origin } — adds a website (to verify with a DNS TXT record).
export const POST = api(async ({ request, params, db, user, limits }) => {
  const app = await requireApp(db, user.id, params.id);
  const body = await readJson(request);
  const origin = normaliseOrigin(typeof body.origin === 'string' ? body.origin : '');
  if (!origin) throw new HttpError(400, 'originInvalid');
  // Local development is a setting of the app, not a website to verify.
  if (isLocalOrigin(origin)) throw new HttpError(400, 'originLocal');
  if ((await listOrigins(db, app.id)).length >= limits.origins) {
    throw new HttpError(403, 'originLimit', { max: limits.origins });
  }
  if (!(await addOrigin(db, app.id, origin))) throw new HttpError(409, 'originExists');
});
