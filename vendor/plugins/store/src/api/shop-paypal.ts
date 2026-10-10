import { isLocale } from '@devquake/ui';
import { shopApi } from '../lib/api';
import { markPaidByProvider, orderByCode, storeSecrets } from '../lib/data';
import { HttpError } from '../lib/http';
import { orderPath } from '../lib/pay';
import { capturePaypalOrder } from '../lib/paypal';

// GET /api/s/:slug/orders/:code/paypal?token=…: PayPal sends the buyer back here after they
// approved (a key route). The order is captured for the expected amount and marked paid; the
// buyer lands on the order's page either way.
export const GET = shopApi(
  async ({ request, params, db, store, locale, ctx }) => {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang');
    const order = await orderByCode(db, store.id, params.code ?? '');
    if (!order) throw new HttpError(404, 'orderNotFound');
    const page = `${ctx.baseUrl}${orderPath(store.slug, order.code, isLocale(lang) ? lang : locale)}`;
    const token = url.searchParams.get('token') ?? '';
    if (
      order.method === 'paypal' &&
      order.status === 'awaiting_payment' &&
      token &&
      token === order.providerRef
    ) {
      const { paypalSecret } = await storeSecrets(db, store.id);
      if (paypalSecret && store.paypal.clientId) {
        const captured = await capturePaypalOrder(
          { live: store.paypal.live, clientId: store.paypal.clientId, secret: paypalSecret },
          token,
          { totalCents: order.totalCents, currency: order.currency },
        );
        if (captured.ok) {
          await markPaidByProvider(db, store.id, order.code, {
            ref: token,
            amountCents: order.totalCents,
            currency: order.currency,
            method: 'paypal',
          });
        } else {
          console.warn(`[store] paypal capture for store ${store.id}: ${captured.error}`);
        }
      }
    }
    return Response.redirect(page, 303);
  },
  { limit: 20, unpublished: true },
);
