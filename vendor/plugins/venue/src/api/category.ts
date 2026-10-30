import { jsonBody, ownerApi } from '../lib/api';
import { menuOf, removeCategory, renameCategory } from '../lib/data';
import { HttpError } from '../lib/http';
import { nameOf } from '../lib/names';

// PUT /api/categories/:id { name }: renames it; DELETE: removes it with its items.
export const PUT = ownerApi(async ({ request, params, db, venue }) => {
  const name = nameOf(await jsonBody(request));
  if (!(await renameCategory(db, venue.id, Number(params.id), name)))
    throw new HttpError(404, 'notFound');
  return menuOf(db, venue.id);
});

export const DELETE = ownerApi(async ({ params, db, venue }) => {
  if (!(await removeCategory(db, venue.id, Number(params.id))))
    throw new HttpError(404, 'notFound');
  return menuOf(db, venue.id);
});
