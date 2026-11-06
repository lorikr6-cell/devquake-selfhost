import { api } from '../lib/api';
import { withRouteNotice } from '../lib/notify';
import { computeOrder } from '../lib/routes-data';
import { id, readBody, routeDay } from '../lib/validate';

// POST /api/orgs/:id/routes/:day/optimise { driverId }: the order of the driver's stops from
// the map (OpenRouteService; addresses only, never names). Needs CANTEEN_ORS_KEY. The driver is
// told when the order changed.
export const POST = api(async (scope) => {
  const { request, params, db, user } = scope;
  const { driverId } = await readBody(request);
  const orgId = id(params.id);
  const day = routeDay(params.day);
  return withRouteNotice(scope, orgId, day, () =>
    computeOrder(db, orgId, user.id, day, id(driverId)),
  );
});
