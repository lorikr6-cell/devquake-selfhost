import { api } from '../lib/api';
import { importDish, listDishes } from '../lib/dishes-data';
import { HttpError } from '../lib/http';
import { id, readBody } from '../lib/validate';

// GET /api/orgs/:id/dishes: the organisation's dishes with their ingredients.
export const GET = api(async ({ params, db, user }) => ({
  dishes: await listDishes(db, id(params.id), user.id),
}));

// POST /api/orgs/:id/dishes { ref }: copies a recipe from the visitor's Cookbook (or refreshes it).
export const POST = api(async ({ request, params, db, user, links }) => {
  const { ref } = await readBody(request);
  if (typeof ref !== 'string') throw new HttpError(400, 'invalidRequest');
  return importDish(db, id(params.id), user.id, links, ref);
});
