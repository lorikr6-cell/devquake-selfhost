import { api } from '../lib/api';
import { isIsoDate } from '../lib/dates';
import { HttpError } from '../lib/http';
import { checkDishes, saveMenu } from '../lib/meals-data';
import { DIETS, type Diet } from '../lib/model';
import { id, readBody } from '../lib/validate';

// PUT /api/orgs/:id/menus { day, meal (0 = delivered meal, else a meal time id), dishes,
// variants: { diabetic: "…", … } }: organisers and coordinators; empty dishes remove the menu.
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  if (!isIsoDate(body.day)) throw new HttpError(400, 'date', { field: 'day' });
  const meal = Number(body.meal);
  if (!Number.isSafeInteger(meal) || meal < 0) throw new HttpError(400, 'invalidRequest');
  const variants: Partial<Record<Diet, string>> = {};
  const given = (body.variants ?? {}) as Record<string, unknown>;
  for (const diet of DIETS) {
    const text = checkDishes(given[diet]);
    if (text) variants[diet] = text;
  }
  await saveMenu(db, id(params.id), user.id, {
    day: body.day,
    meal,
    dishes: checkDishes(body.dishes),
    variants,
  });
});
