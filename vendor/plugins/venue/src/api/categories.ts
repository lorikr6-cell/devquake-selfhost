import { jsonBody, ownerApi } from '../lib/api';
import { addCategory, menuOf } from '../lib/data';
import { nameOf } from '../lib/names';

// POST /api/categories { name }: a new menu category.
export const POST = ownerApi(async ({ request, db, venue }) => {
  await addCategory(db, venue.id, nameOf(await jsonBody(request)));
  return menuOf(db, venue.id);
});
