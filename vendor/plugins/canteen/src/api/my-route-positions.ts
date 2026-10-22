import { api } from '../lib/api';
import { myRoutePositions } from '../lib/routes-data';
import { id, routeDay } from '../lib/validate';

// GET /api/orgs/:id/my-route/positions?day=: the signed-in driver's stops on the map (asked
// only when they open the map, so addresses are looked up only then).
export const GET = api(async ({ request, params, db, user, today }) => {
  const day = new URL(request.url).searchParams.get('day') ?? today;
  return myRoutePositions(db, id(params.id), user.id, routeDay(day));
});
