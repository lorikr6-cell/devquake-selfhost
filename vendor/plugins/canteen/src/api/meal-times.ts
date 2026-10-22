import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { parseTime } from '../lib/meals';
import { saveMealTime, type MealTimeInput } from '../lib/meals-data';
import { id, readBody, requiredText, type Body } from '../lib/validate';

/** { name, starts: "08:00", ends: "08:30" } with the end after the start. */
export function mealTimeInput(body: Body): MealTimeInput {
  const name = requiredText(body.name, 'mealName', 40);
  const startsMin = parseTime(body.starts);
  const endsMin = parseTime(body.ends);
  if (startsMin === null || endsMin === null || endsMin <= startsMin) {
    throw new HttpError(400, 'mealTimeRange');
  }
  return { name, startsMin, endsMin };
}

// POST /api/orgs/:id/meal-times: organisers and coordinators add a residents' meal time.
export const POST = api(async ({ request, params, db, user }) => {
  const mealTimeId = await saveMealTime(
    db,
    id(params.id),
    user.id,
    mealTimeInput(await readBody(request)),
  );
  return { id: mealTimeId };
});
