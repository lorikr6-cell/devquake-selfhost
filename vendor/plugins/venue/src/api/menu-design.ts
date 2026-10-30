import { badInput, jsonBody, ownerApi } from '../lib/api';
import { checkDesign, saveDesign } from '../lib/design';

// PUT /api/menu/design: the menu's look (title, font, colours, panel, columns, what to show).
export const PUT = ownerApi(async ({ request, db, venue }) => {
  const checked = checkDesign(await jsonBody(request));
  if (!checked.ok) throw badInput(checked);
  await saveDesign(db, venue.id, checked.value);
});
