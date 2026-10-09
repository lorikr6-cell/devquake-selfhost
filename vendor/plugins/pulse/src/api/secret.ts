import { api } from '../lib/api';
import { rotateSecret } from '../lib/data';
import { changed, requireApp } from '../lib/own-app';

// POST /api/apps/:id/secret — a new secret key (shown once); the previous one keeps working for
// a day so the member can update their server without downtime.
export const POST = api(async ({ params, db, user, master }) => {
  const app = await requireApp(db, user.id, params.id);
  const secret = await rotateSecret(db, app, master);
  changed(app);
  return { secret };
});
