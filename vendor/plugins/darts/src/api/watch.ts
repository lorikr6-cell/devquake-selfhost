import { api } from '../lib/api';
import { watchView } from '../lib/data/games';
import { HttpError } from '../lib/http';
import { CODE_PATTERN, cleanCode } from '../lib/model';

// GET /api/watch/:code?v=<version>: a game to watch, read-only, for anyone signed in to
// DevQuake who has its watch code (a signed-in route, ADR 0022).
export const GET = api(async ({ params, db, url }) => {
  const code = cleanCode(params.code);
  if (!CODE_PATTERN.test(code)) throw new HttpError(404, 'notFound');
  const view = await watchView(db, code);
  if (url.searchParams.get('v') === String(view.version)) return { changed: false };
  return { changed: true, game: view };
});
