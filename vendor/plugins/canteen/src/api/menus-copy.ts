import { api } from '../lib/api';
import { isIsoDate, mondayOf } from '../lib/dates';
import { HttpError } from '../lib/http';
import { copyWeek } from '../lib/meals-data';
import { id, readBody } from '../lib/validate';

// POST /api/orgs/:id/menus/copy { from, to }: copies the week of `from` onto the week of `to`.
export const POST = api(async ({ request, params, db, user }) => {
  const { from, to } = await readBody(request);
  if (!isIsoDate(from) || !isIsoDate(to)) throw new HttpError(400, 'invalidRequest');
  const copied = await copyWeek(db, id(params.id), user.id, mondayOf(from), mondayOf(to));
  return { copied };
});
