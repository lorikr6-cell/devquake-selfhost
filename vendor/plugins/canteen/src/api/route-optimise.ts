import { api } from '../lib/api';
import { computeOrder } from '../lib/routes-data';
import { id, readBody, routeDay } from '../lib/validate';

// POST /api/orgs/:id/routes/:day/optimise { driverId }: the order of the driver's stops from
// the map (OpenRouteService; addresses only, never names). Needs CANTEEN_ORS_KEY.
export const POST = api(async ({ request, params, db, user }) => {
  const { driverId } = await readBody(request);
  return computeOrder(db, id(params.id), user.id, routeDay(params.day), id(driverId));
});
