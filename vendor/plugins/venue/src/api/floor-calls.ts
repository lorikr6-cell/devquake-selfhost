import { callHistory, openCalls } from '../lib/calls';
import { floorApi } from '../lib/floor-api';

// GET /api/floor/calls[?history=1]: the tables calling now (oldest first) and, with history,
// the last 200 calls (the notification list).
export const GET = floorApi(async ({ request, db, venue }) => {
  const history = new URL(request.url).searchParams.get('history') === '1';
  return {
    open: await openCalls(db, venue.id),
    ...(history ? { history: await callHistory(db, venue.id) } : {}),
  };
});
