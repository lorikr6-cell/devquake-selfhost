import { shopApi } from '../lib/api';
import { priceCart, quote } from '../lib/checkout';
import { methodsOf, orderById, placeOrder, sellableVariants, zonesOf } from '../lib/data';
import { HttpError } from '../lib/http';
import { shopMailConfigured } from '../lib/mailer';
import { VOUCHER_CODE, normalizeCode, publicVoucher, voucherProblem } from '../lib/marketing';
import { liveRules, voucherByCode } from '../lib/marketing-data';
import { parseCart } from '../lib/model';
import { subscribe } from '../lib/newsletter-data';
import { orderPath, startPayment } from '../lib/pay';
import { sendOrderConfirmation, sendSubscribeConfirmation } from '../lib/shop-mail';
import { formatCents } from '../lib/pricing';
import { ruleLabel } from '../lib/rules';
import { LOCALE_TAGS } from '@devquake/ui';
import { translator } from '../i18n';
import { setBuyerDetails } from '../lib/buyers-data';
import { buyerInput, paymentMethod, readBody } from '../lib/validate';

/**
 * POST /api/s/:slug/checkout { cart, buyer, method, voucher?, newsletter?, expectedTotal }:
 * places the order (a key route: buyers need no account). Prices, campaigns, sales, stock,
 * vouchers and shipping come from the database; when the total is not what the buyer saw,
 * nothing is ordered and they see the new sums. Answers where to go next: Stripe or PayPal, or
 * the order's page. The buyer gets a confirmation email when the shop can send email.
 */
export const POST = shopApi(
  async ({ request, db, store, locale, t, ctx, buyer: signedIn }) => {
    const body = await readBody(request, 64 * 1024);
    const cart = parseCart(body.cart);
    if (!cart) throw new HttpError(400, 'cart');
    const method = paymentMethod(body.method);
    if (!methodsOf(store).includes(method)) throw new HttpError(400, 'paymentMethod');
    const buyer = buyerInput(body);
    const code = typeof body.voucher === 'string' ? normalizeCode(body.voucher) : '';
    const voucher =
      code && VOUCHER_CODE.test(code) ? await voucherByCode(db, store.id, code) : null;
    if (code) {
      const problem = voucherProblem(voucher, new Date());
      if (problem) throw new HttpError(409, `voucher.${problem}`);
    }

    const now = new Date();
    const variants = await sellableVariants(
      db,
      store.id,
      cart.map((l) => l.variantId),
    );
    const priced = priceCart(cart, variants, store.vatRate, now);
    if (!priced.ok) {
      return Response.json(
        { error: t('errors.cartChanged'), code: 'cartChanged', problems: priced.problems },
        { status: 409 },
      );
    }
    const q = quote({
      items: priced.items,
      zones: await zonesOf(db, store.id),
      country: buyer.country,
      method,
      codFeeCents: store.cod.feeCents,
      storeVatRate: store.vatRate,
      voucher: voucher ? publicVoucher(voucher) : null,
      rules: await liveRules(db, store.id, now),
    });
    if (!q.ok)
      throw new HttpError(400, q.reason === 'voucherMin' ? 'voucher.minOrder' : 'noShipping');
    if (Number(body.expectedTotal) !== q.totals.totalCents) {
      return Response.json(
        { error: t('errors.totalChanged'), code: 'totalChanged', totalCents: q.totals.totalCents },
        { status: 409 },
      );
    }

    const placed = await placeOrder(
      db,
      {
        storeId: store.id,
        method,
        currency: store.currency,
        totals: q.totals,
        buyer,
        zoneName: q.zone.name,
        items: priced.items,
        voucher: voucher ? { id: voucher.id, code: voucher.code } : null,
        locale,
        autoDiscount: q.auto.discount
          ? {
              cents: q.auto.discountCents,
              label: ruleLabel(translator(locale, 'rules'), q.auto.discount, (c) =>
                formatCents(c, store.currency, LOCALE_TAGS[locale]),
              ),
            }
          : null,
      },
      (locked) => {
        // Stock may have changed since the page was loaded: check again under the lock.
        const again = priceCart(cart, locked, store.vatRate, now);
        if (!again.ok) throw new HttpError(409, 'cartChanged');
      },
    );
    const order = await orderById(db, store.id, placed.id);
    // A signed-in buyer may keep these delivery details for next time (ADR 0059).
    if (body.remember === true) {
      const me = await signedIn().catch(() => null);
      if (me) {
        await setBuyerDetails(db, me.id, {
          phone: buyer.phone,
          addressLine: buyer.addressLine,
          city: buyer.city,
          postalCode: buyer.postalCode,
          country: buyer.country,
        }).catch(() => undefined);
      }
    }
    if (order && shopMailConfigured()) {
      // The buyer's copy of the order page's link; a failed email never fails the order.
      await sendOrderConfirmation(store, ctx.baseUrl, order, locale).catch(() => false);
      if (body.newsletter === true) {
        const sub = await subscribe(db, store.id, buyer.email, locale, 'checkout');
        if (sub.needsConfirmation) {
          await sendSubscribeConfirmation(
            store,
            ctx.baseUrl,
            buyer.email,
            sub.subscriber.token,
            locale,
          ).catch(() => false);
        }
      }
    }
    // A failed payment start keeps the order: its page offers "Pay now" again.
    const redirect = order
      ? await startPayment(db, store, order, ctx.baseUrl, locale, t).catch(() => null)
      : null;
    return {
      code: placed.code,
      redirect: redirect ?? `${ctx.baseUrl}${orderPath(store.slug, placed.code, locale)}?new=1`,
    };
  },
  { limit: 10, sameSite: true },
);
