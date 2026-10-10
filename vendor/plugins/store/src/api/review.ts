import { api, mine } from '../lib/api';
import { HttpError } from '../lib/http';
import { REVIEW_STATUSES, type ReviewStatus } from '../lib/reviews';
import { deleteReview, moderateReview } from '../lib/reviews-data';
import { id, readBody, replyText } from '../lib/validate';

// PATCH /api/reviews/:id { status?, reply? }: publish or hide a review, answer it.
export const PATCH = api('reviews', async ({ request, params, db, store }) => {
  const body = await readBody(request);
  if (body.status !== undefined && !REVIEW_STATUSES.includes(body.status as ReviewStatus))
    throw new HttpError(400, 'invalidRequest');
  await moderateReview(db, mine(store).id, id(params.id), {
    status: body.status as ReviewStatus | undefined,
    reply: body.reply === undefined ? undefined : replyText(body.reply),
  });
});

export const DELETE = api('reviews', async ({ params, db, store }) => {
  await deleteReview(db, mine(store).id, id(params.id));
});
