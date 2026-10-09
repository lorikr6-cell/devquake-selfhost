import { api, readJson } from '../lib/api';
import { countApps, createApp, listApps } from '../lib/data';
import { HttpError } from '../lib/http';
import { NAME_MAX, text } from '../lib/validate';

// GET /api/apps — the member's API services. POST { name } — a new one; answers its id and the
// secret key, shown this once.

export const GET = api(async ({ db, user }) => ({ apps: await listApps(db, user.id) }));

export const POST = api(async ({ request, db, user, master, limits }) => {
  const body = await readJson(request);
  const name = text(body.name, 'name', NAME_MAX);
  if ((await countApps(db, user.id)) >= limits.apps) {
    throw new HttpError(403, 'appLimit', { max: limits.apps });
  }
  return createApp(db, user.id, name, master);
});
