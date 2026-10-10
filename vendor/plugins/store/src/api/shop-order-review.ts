import { shopApi } from '../lib/api';
import { orderByCode } from '../lib/data';
import { HttpError } from '../lib/http';
import { canReviewOrder, initialStatus } from '../lib/reviews';
import { addReview } from '../lib/reviews-data';
import { id, readBody, reviewInput } from '../lib/validate';

// POST /api/s/:slug/orders/:code/reviews { productId, rating, title, body, author }: a verified
// buyer reviews a product of their order (once it is on its way), from the order's secret page.
export const POST = shopApi(
  async ({ request, params, db, store }) => {
    if (store.reviewsMode === 'off') throw new HttpError(403, 'reviewsOff');
    const order = await orderByCode(db, store.id, params.code ?? '');
    if (!order) throw new HttpError(404, 'orderNotFound');
    if (!canReviewOrder(order.status)) throw new HttpError(409, 'reviewTooEarly');
    const body = await readBody(request, 16 * 1024);
    const productId = id(body.productId);
    if (!order.items.some((i) => i.productId === productId)) throw new HttpError(404, 'notFound');
    const status = initialStatus(store.reviewsMode, true);
    await addReview(db, {
      storeId: store.id,
      productId,
      orderId: order.id,
      verified: true,
      status,
      ...reviewInput(body),
    });
    return { status };
  },
  { limit: 10, sameSite: true },
);
