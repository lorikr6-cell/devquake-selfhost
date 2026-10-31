import { jsonBody } from '../lib/api';
import { answerCall, openCalls } from '../lib/calls';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// PUT /api/floor/calls/:id { status: 'coming' | 'done' }: a waiter answers a guest's call.
export const PUT = floorApi(async ({ request, params, db, venue, actor }) => {
  const status = (await jsonBody(request)).status;
  if (status !== 'coming' && status !== 'done') throw new HttpError(400, 'generic');
  await answerCall(db, venue.id, Number(params.id), status, actor.name);
  return { open: await openCalls(db, venue.id) };
});
