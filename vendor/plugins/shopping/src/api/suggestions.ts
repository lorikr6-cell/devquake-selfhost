import { api } from '../lib/api';
import { suggestionRows } from '../lib/data';
import { buildSuggestions } from '../lib/suggestions';

// GET /api/suggestions: the user's products from earlier lists (most frequent first), for the
// autocomplete and "Usual products". The browser filters them while the user types.
export const GET = api(async ({ db, user }) => ({
  suggestions: buildSuggestions(await suggestionRows(db, user.id)).slice(0, 300),
}));
