import type { PluginDatabase } from '@devquake/plugin-sdk';
import { localizePath, type Locale, type Translate } from '@devquake/ui';
import { chargeLines } from './checkout';
import { setProviderRef, storeSecrets, type Order, type Store } from './data';
import { HttpError } from './http';
import { orderReference } from './model';
import { createPaypalOrder } from './paypal';
import { createCheckoutSession } from './stripe';

/** The buyer's page of an order, in their language. */
export const orderPath = (slug: string, code: string, locale: Locale) =>
  localizePath(`/s/${slug}/orders/${code}`, locale);

/**
 * Sends the buyer to Stripe or PayPal for an order awaiting payment: a new attempt each time
 * (its id is kept, so only that attempt can mark the order paid). Bank transfer and cash on
 * delivery need no redirect (null).
 */
export async function startPayment(
  db: PluginDatabase,
  store: Store,
  order: Order,
  baseUrl: string,
  locale: Locale,
  t: Translate,
): Promise<string | null> {
  if (order.method !== 'stripe' && order.method !== 'paypal') return null;
  if (order.status !== 'awaiting_payment') throw new HttpError(409, 'alreadyPaid');
  const back = `${baseUrl}${orderPath(store.slug, order.code, locale)}`;
  const secrets = await storeSecrets(db, store.id);

  if (order.method === 'stripe') {
    if (!secrets.stripeSecret) throw new HttpError(503, 'paymentUnavailable');
    const totals = {
      itemsCents: order.itemsCents,
      discountCents: order.discountCents,
      shippingCents: order.shippingCents,
      feeCents: order.feeCents,
      totalCents: order.totalCents,
      vatCents: order.vatCents,
    };
    const session = await createCheckoutSession(secrets.stripeSecret, {
      // A new idempotency key per attempt: the same order may be paid again after a cancel.
      orderCode: order.code,
      attempt: Date.now().toString(36),
      currency: order.currency,
      email: order.buyer.email,
      lines: chargeLines(order.items, totals, {
        shipping: t('checkout.shippingLine'),
        fee: t('checkout.codFeeLine'),
        order: t('checkout.orderLine', { ref: orderReference(order.id), store: store.name }),
      }),
      successUrl: `${back}?new=1&paid=1`,
      cancelUrl: back,
    });
    if (!session.ok) {
      console.warn(`[store] stripe checkout for store ${store.id}: ${session.error}`);
      throw new HttpError(502, 'paymentFailed');
    }
    await setProviderRef(db, order.id, session.value.id);
    return session.value.url;
  }

  if (!secrets.paypalSecret || !store.paypal.clientId)
    throw new HttpError(503, 'paymentUnavailable');
  const created = await createPaypalOrder(
    { live: store.paypal.live, clientId: store.paypal.clientId, secret: secrets.paypalSecret },
    {
      orderCode: order.code,
      attempt: Date.now().toString(36),
      currency: order.currency,
      totalCents: order.totalCents,
      storeName: store.name,
      returnUrl: `${baseUrl}/api/s/${store.slug}/orders/${order.code}/paypal?lang=${locale}`,
      cancelUrl: back,
    },
  );
  if (!created.ok) {
    console.warn(`[store] paypal order for store ${store.id}: ${created.error}`);
    throw new HttpError(502, 'paymentFailed');
  }
  await setProviderRef(db, order.id, created.value.id);
  return created.value.approveUrl;
}
