// Ratings and comments (ADR 0058): the rules every review follows, pure and tested
// (reviews.test.ts). Buyers never sign in: a review from the product page is held for the
// owner; one from a buyer's order page is a verified purchase.

export const REVIEW_MODES = ['off', 'moderated', 'verified'] as const;
export type ReviewMode = (typeof REVIEW_MODES)[number];
export const isReviewMode = (v: unknown): v is ReviewMode => REVIEW_MODES.includes(v as ReviewMode);

export const REVIEW_STATUSES = ['pending', 'published', 'hidden'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_LIMITS = { author: 60, title: 100, body: 2000, reply: 2000 } as const;

/** Whether a new review is shown at once (only verified buyers, and only in "verified" mode). */
export function initialStatus(mode: ReviewMode, verified: boolean): ReviewStatus {
  return mode === 'verified' && verified ? 'published' : 'pending';
}

/** Orders whose buyer may review what they bought: once it is on its way. */
export const canReviewOrder = (status: string) => status === 'shipped' || status === 'delivered';

export interface RatingSummary {
  count: number;
  /** One decimal; 0 without reviews. */
  average: number;
  /** How many reviews gave 1…5 stars (index 0 is one star). */
  stars: [number, number, number, number, number];
}

export function summarize(ratings: number[]): RatingSummary {
  const stars: RatingSummary['stars'] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of ratings) {
    if (!Number.isInteger(r) || r < 1 || r > 5) continue;
    stars[r - 1]! += 1;
    sum += r;
  }
  const count = stars.reduce((s, n) => s + n, 0);
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : 0, stars };
}

/** A bot filled in the field people never see. */
export const isTrap = (value: unknown) => typeof value === 'string' && value.trim() !== '';
