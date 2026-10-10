import { api, mine } from '../lib/api';
import { updateTheme } from '../lib/data';
import { HttpError } from '../lib/http';
import { parseTheme } from '../lib/theme';
import { readBody } from '../lib/validate';

// PUT /api/store/theme { theme } (null: back to the app's own look): the shop's design.
export const PUT = api('design', async ({ request, db, store }) => {
  const { theme } = await readBody(request);
  if (theme === null) return updateTheme(db, mine(store).id, null);
  const parsed = parseTheme(theme);
  if (!parsed) throw new HttpError(400, 'theme');
  await updateTheme(db, mine(store).id, parsed);
});
