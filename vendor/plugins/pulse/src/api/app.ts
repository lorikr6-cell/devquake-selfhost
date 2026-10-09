import { api, readJson } from '../lib/api';
import { deleteApps, updateApp } from '../lib/data';
import { changed, requireApp } from '../lib/own-app';
import { NAME_MAX, flag, serverIps, text } from '../lib/validate';

// PATCH /api/apps/:id — name and settings; DELETE — removes the app and everything it produced.

export const PATCH = api(async ({ request, params, db, user }) => {
  const app = await requireApp(db, user.id, params.id);
  const body = await readJson(request);
  await updateApp(db, app.id, {
    name: body.name === undefined ? undefined : text(body.name, 'name', NAME_MAX),
    browserPublish: flag(body.browserPublish),
    strictSchema: flag(body.strictSchema),
    allowLocalhost: flag(body.allowLocalhost),
    paused: flag(body.paused),
    serverIps: body.serverIps === undefined ? undefined : serverIps(body.serverIps),
  });
  changed(app);
});

export const DELETE = api(async ({ params, db, user }) => {
  const app = await requireApp(db, user.id, params.id);
  await deleteApps(db, [app.id]);
  changed(app);
});
