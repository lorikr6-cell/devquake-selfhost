import { shopApi } from '../lib/api';
import { productBySlug } from '../lib/data';
import { HttpError } from '../lib/http';
import { initialStatus, isTrap } from '../lib/reviews';
import { addReview } from '../lib/reviews-data';
import { readBody, reviewInput } from '../lib/validate';

// POST /api/s/:slug/p/:product/reviews { rating, title, body, author }: a review from the
// product page (a key route). It waits for the owner; the field people never see catches bots.
export const POST = shopApi(
  async ({ request, params, db, store }) => {
    if (store.reviewsMode === 'off') throw new HttpError(403, 'reviewsOff');
    const product = await productBySlug(db, store.id, params.product ?? '');
    if (!product || !product.published) throw new HttpError(404, 'productNotFound');
    const body = await readBody(request, 16 * 1024);
    const review = reviewInput(body);
    // A bot: answer as if it worked, keep nothing.
    if (isTrap(body.website)) return { status: 'pending' };
    const status = initialStatus(store.reviewsMode, false);
    await addReview(db, {
      storeId: store.id,
      productId: product.id,
      orderId: null,
      verified: false,
      status,
      ...review,
    });
    return { status };
  },
  { limit: 3, sameSite: true },
);
