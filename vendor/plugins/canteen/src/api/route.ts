import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { setRoute } from '../lib/routes-data';
import { id, readBody, routeDay } from '../lib/validate';

// PUT /api/orgs/:id/routes/:day { driverId, personIds }: a driver's whole route that day, in
// order. People on it leave any other route of the day.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const personIds = Array.isArray(body.personIds) ? body.personIds.map((p) => id(p)) : null;
  if (!personIds || personIds.length > 200) throw new HttpError(400, 'invalidRequest');
  await setRoute(db, id(params.id), user.id, routeDay(params.day), id(body.driverId), personIds);
});
