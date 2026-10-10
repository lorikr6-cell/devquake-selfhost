import { shopApi } from '../lib/api';
import { methodsOf, orderByCode } from '../lib/data';
import { HttpError } from '../lib/http';
import { startPayment } from '../lib/pay';

// POST /api/s/:slug/orders/:code/pay: "Pay now" on an order awaiting a card or PayPal payment
// (a key route); answers where to pay.
export const POST = shopApi(
  async ({ params, db, store, locale, t, ctx }) => {
    const order = await orderByCode(db, store.id, params.code ?? '');
    if (!order) throw new HttpError(404, 'orderNotFound');
    if (!methodsOf(store).includes(order.method)) throw new HttpError(503, 'paymentUnavailable');
    const redirect = await startPayment(db, store, order, ctx.baseUrl, locale, t);
    if (!redirect) throw new HttpError(409, 'invalidRequest');
    return { redirect };
  },
  { limit: 10, sameSite: true, unpublished: true },
);
