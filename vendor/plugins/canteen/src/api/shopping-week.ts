import { api } from '../lib/api';
import { mondayOf, isIsoDate } from '../lib/dates';
import { purchasingLists, sendWeekToShopping, weekIngredients } from '../lib/dishes-data';
import { HttpError } from '../lib/http';
import { id, readBody } from '../lib/validate';

const week = (value: unknown) => {
  if (!isIsoDate(value)) throw new HttpError(400, 'date', { field: 'day' });
  return mondayOf(value);
};

// GET /api/orgs/:id/shopping?week=: the week's ingredients, the visitor's Shopping lists and the
// organisation's purchasing list.
export const GET = api(async ({ request, params, db, user, links }) => {
  const orgId = id(params.id);
  const monday = week(new URL(request.url).searchParams.get('week'));
  const [items, lists] = await Promise.all([
    weekIngredients(db, orgId, user.id, monday),
    purchasingLists(db, orgId, user.id, links),
  ]);
  return { week: monday, items, ...lists };
});

// POST /api/orgs/:id/shopping { week, listId, listName, force? }: sends them to that list.
export const POST = api(async ({ request, params, db, user, links }) => {
  const body = await readBody(request);
  const listId = Number(body.listId);
  if (!Number.isSafeInteger(listId) || listId <= 0) throw new HttpError(400, 'invalidRequest');
  const name = typeof body.listName === 'string' ? body.listName : '';
  return sendWeekToShopping(
    db,
    id(params.id),
    user.id,
    links,
    week(body.week),
    { id: listId, name },
    body.force === true,
  );
});
