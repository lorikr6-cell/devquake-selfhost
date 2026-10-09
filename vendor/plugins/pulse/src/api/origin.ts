import { api } from '../lib/api';
import { listOrigins, markOriginVerified, removeOrigin } from '../lib/data';
import { HttpError } from '../lib/http';
import { originProof } from '../lib/keys';
import { lookupProof, proofRecordName } from '../lib/origins';
import { changed, requireApp } from '../lib/own-app';
import { routeId } from '../lib/validate';

// DELETE /api/apps/:id/origins/:originId — removes a website.
// POST   /api/apps/:id/origins/:originId — checks its DNS TXT record and marks it verified.

async function find(db: Parameters<typeof listOrigins>[0], appId: number, raw: string | undefined) {
  const originId = routeId(raw);
  const origin = (await listOrigins(db, appId)).find((o) => o.id === originId);
  if (!origin) throw new HttpError(404, 'notFound');
  return origin;
}

export const DELETE = api(async ({ params, db, user }) => {
  const app = await requireApp(db, user.id, params.id);
  const origin = await find(db, app.id, params.originId);
  await removeOrigin(db, app.id, origin.id);
  changed(app);
});

export const POST = api(async ({ params, db, user }) => {
  const app = await requireApp(db, user.id, params.id);
  const origin = await find(db, app.id, params.originId);
  const records = await lookupProof(origin.origin);
  if (!records.includes(originProof(origin.verifyToken))) {
    throw new HttpError(422, 'notVerified', { name: proofRecordName(origin.origin) });
  }
  await markOriginVerified(db, app.id, origin.id);
  changed(app);
});
