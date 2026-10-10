import { shopApi } from '../lib/api';
import { markPaidByProvider, storeSecrets } from '../lib/data';
import { HttpError } from '../lib/http';
import { paidSessionOf, verifyStripeSignature } from '../lib/stripe';

// POST /api/s/:slug/stripe: the shop owner's Stripe webhook (a key route). Only events signed
// with the owner's webhook secret count; a paid Checkout Session marks its order paid when it is
// the order's current attempt with the same amount and currency.
export const POST = shopApi(
  async ({ request, db, store }) => {
    const payload = await request.text();
    if (payload.length > 512 * 1024) throw new HttpError(413, 'tooLarge');
    const { stripeWebhook } = await storeSecrets(db, store.id);
    const signature = request.headers.get('stripe-signature');
    if (!stripeWebhook || !verifyStripeSignature(payload, signature, stripeWebhook)) {
      throw new HttpError(400, 'signature');
    }
    const paid = paidSessionOf(JSON.parse(payload));
    if (paid) {
      const ok = await markPaidByProvider(db, store.id, paid.orderCode, {
        ref: paid.sessionId,
        amountCents: paid.amountCents,
        currency: paid.currency,
        method: 'stripe',
      });
      if (!ok) {
        console.warn(
          `[store] stripe session ${paid.sessionId} matched no order of store ${store.id}`,
        );
      }
    }
    // Stripe only needs to know the event arrived.
    return { received: true };
  },
  { limit: 120, unpublished: true },
);
