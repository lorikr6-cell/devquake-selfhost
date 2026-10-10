import { api, mine } from '../lib/api';
import { updateReviewsMode } from '../lib/data';
import { HttpError } from '../lib/http';
import { isReviewMode } from '../lib/reviews';
import { readBody } from '../lib/validate';

// PUT /api/store/reviews { mode: off | moderated | verified }: how reviews are published.
export const PUT = api('reviews', async ({ request, db, store }) => {
  const { mode } = await readBody(request);
  if (!isReviewMode(mode)) throw new HttpError(400, 'invalidRequest');
  await updateReviewsMode(db, mine(store).id, mode);
});
