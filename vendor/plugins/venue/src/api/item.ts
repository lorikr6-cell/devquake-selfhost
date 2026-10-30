import { badInput, jsonBody, ownerApi } from '../lib/api';
import { menuOf, removeItem, updateItem } from '../lib/data';
import { HttpError } from '../lib/http';
import { checkItem } from '../lib/model';

// PUT /api/items/:id: changes an item (price, allergens, available…); DELETE: removes it.
export const PUT = ownerApi(async ({ request, params, db, venue }) => {
  const checked = checkItem(await jsonBody(request), venue);
  if (!checked.ok) throw badInput(checked);
  if (!(await updateItem(db, venue.id, Number(params.id), checked.value)))
    throw new HttpError(404, 'notFound');
  return menuOf(db, venue.id);
});

export const DELETE = ownerApi(async ({ params, db, venue }) => {
  if (!(await removeItem(db, venue.id, Number(params.id)))) throw new HttpError(404, 'notFound');
  return menuOf(db, venue.id);
});
