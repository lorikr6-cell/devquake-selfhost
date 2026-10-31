import { jsonBody } from '../lib/api';
import { setBillWaiter, waiters } from '../lib/calls';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// GET /api/floor/bills/:id/waiter: who it can be handed to; PUT { staffId }: hands the table to
// that waiter (a colleague taking over).
export const GET = floorApi(async ({ db, venue }) => ({ waiters: await waiters(db, venue.id) }));

export const PUT = floorApi(async ({ request, params, db, venue }) => {
  const id = Number((await jsonBody(request)).staffId);
  const w = (await waiters(db, venue.id)).find((x) => x.id === id);
  if (!w) throw new HttpError(404, 'notFound');
  if (!(await setBillWaiter(db, venue.id, Number(params.id), w)))
    throw new HttpError(409, 'billClosed');
  return { waiter: w };
});
