import { badInput, jsonBody, ownerApi } from '../lib/api';
import { addItem, menuOf } from '../lib/data';
import { HttpError } from '../lib/http';
import { checkItem } from '../lib/model';

// POST /api/items: a new menu item in one of the venue's categories.
export const POST = ownerApi(async ({ request, db, venue }) => {
  const checked = checkItem(await jsonBody(request), venue);
  if (!checked.ok) throw badInput(checked);
  if ((await addItem(db, venue.id, checked.value)) === null) throw new HttpError(404, 'notFound');
  return menuOf(db, venue.id);
});
