import { api } from '../lib/api';
import { withRouteNotice } from '../lib/notify';
import { copyFromLastWeek } from '../lib/routes-data';
import { id, routeDay } from '../lib/validate';

// POST /api/orgs/:id/routes/:day/copy: the same weekday's routes of last week, for the people
// who still get a delivery; the day's routes are replaced. The drivers concerned are told.
export const POST = api(async (scope) => {
  const { params, db, user } = scope;
  const orgId = id(params.id);
  const day = routeDay(params.day);
  return {
    copied: await withRouteNotice(scope, orgId, day, () =>
      copyFromLastWeek(db, orgId, user.id, day),
    ),
  };
});
