import { api, readJson } from '../lib/api';
import { replaceEventTypes } from '../lib/data';
import { checkEventTypes } from '../lib/envelope';
import { HttpError } from '../lib/http';
import { changed, requireApp } from '../lib/own-app';

// PUT /api/apps/:id/event-types { types: [{ name, fields: [{ key, type, required }] }] } — the
// member's own key:value structures (replaces them all).
export const PUT = api(async ({ request, params, db, user, limits }) => {
  const app = await requireApp(db, user.id, params.id);
  const body = await readJson(request);
  const checked = checkEventTypes(body.types, limits.eventTypes);
  if (!checked.ok) {
    if (checked.reason === 'count')
      throw new HttpError(403, 'eventTypeLimit', { max: limits.eventTypes });
    throw new HttpError(400, checked.reason === 'name' ? 'eventTypeName' : 'eventTypeFields', {
      n: checked.index + 1,
    });
  }
  await replaceEventTypes(db, app.id, checked.types);
  changed(app);
});
