import { jsonBody } from '../lib/api';
import { removeLine, setDelivered } from '../lib/floor';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// PUT /api/floor/lines/:id { delivered }: how many were brought; DELETE: removes a line not yet
// brought. The page reloads the bill afterwards.
export const PUT = floorApi(async ({ request, params, db, venue }) => {
  const delivered = Math.round(Number((await jsonBody(request)).delivered));
  if (!Number.isFinite(delivered)) throw new HttpError(400, 'generic');
  await setDelivered(db, venue.id, Number(params.id), delivered);
});

export const DELETE = floorApi(async ({ params, db, venue }) => {
  if (!(await removeLine(db, venue.id, Number(params.id))))
    throw new HttpError(409, 'lineDelivered');
});
