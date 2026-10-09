import { api } from '../lib/api';
import { clearEvents, eventsForUser } from '../lib/data';
import { id, readBody } from '../lib/validate';

// GET /api/events[?after=<id>]: what other people did on the user's lists (in-app
// notifications), newest first. With `after` only newer events. Cleared and removed ones are
// left out.
export const GET = api(async ({ request, db, user }) => {
  const after = Number(new URL(request.url).searchParams.get('after'));
  const since = Number.isSafeInteger(after) && after > 0 ? after : null;
  return { events: await eventsForUser(db, user.id, since, since === null ? 20 : 30) };
});

// DELETE /api/events { upTo }: "Clear all" (everything up to the newest one shown).
export const DELETE = api(async ({ request, db, user }) => {
  const body = await readBody(request);
  await clearEvents(db, user.id, id(body.upTo));
});
