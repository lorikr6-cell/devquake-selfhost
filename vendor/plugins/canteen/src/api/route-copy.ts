import { api } from '../lib/api';
import { copyFromLastWeek } from '../lib/routes-data';
import { id, routeDay } from '../lib/validate';

// POST /api/orgs/:id/routes/:day/copy: the same weekday's routes of last week, for the people
// who still get a delivery; the day's routes are replaced.
export const POST = api(async ({ params, db, user }) => {
  return { copied: await copyFromLastWeek(db, id(params.id), user.id, routeDay(params.day)) };
});
