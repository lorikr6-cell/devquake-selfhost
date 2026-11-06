import { withRouteNotice } from '../lib/notify';
import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { setRoute } from '../lib/routes-data';
import { id, readBody, routeDay } from '../lib/validate';

// PUT /api/orgs/:id/routes/:day { driverId, personIds }: a driver's whole route that day, in
// order. People on it leave any other route of the day. Every driver whose route changed hears
// of it on their phone (ADR 0084).
export const PUT = api(async (scope) => {
  const { request, params, db, user } = scope;
  const body = await readBody(request);
  const personIds = Array.isArray(body.personIds) ? body.personIds.map((p) => id(p)) : null;
  if (!personIds || personIds.length > 200) throw new HttpError(400, 'invalidRequest');
  const day = routeDay(params.day);
  const orgId = id(params.id);
  await withRouteNotice(scope, orgId, day, () =>
    setRoute(db, orgId, user.id, day, id(body.driverId), personIds),
  );
});
