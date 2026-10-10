import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { formatDateTime, rich } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { countryNamer, moneyIn, shopScope } from '../components/guard';
import { OrderSums, StatusBadge } from '../components/order-view';
import { ShopFrame } from '../components/shop';
import { CopyLink, PayNow } from '../components/shop-client';
import { OrderReviews } from '../components/order-reviews';
import { S } from '../components/shop-style';
import { canReviewOrder } from '../lib/reviews';
import { reviewedProducts } from '../lib/reviews-data';
import { Link, cn } from '@devquake/ui';
import { Notice } from '../components/ui';
import { methodsOf, orderByCode } from '../lib/data';
import { formatIban, orderReference, trackingLink } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  // The order's secret link: never indexed, never sent to other sites.
  return {
    title: translator(localeOf(ctx))('meta.orderPage', { store }),
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The buyer's page of their order, behind its secret code: what they ordered, its state, how
 * to pay (bank details, "Pay now"), and the parcel's tracking link once shipped.
 */
export default async function OrderPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, db, timeZone } = scope;
  const t = translator(locale, 'orderPage');
  const order = await orderByCode(db, store.id, params.code ?? '');
  if (!order) {
    return (
      <Notice title={t('notFoundTitle')}>
        <p>{t('notFoundBody')}</p>
      </Notice>
    );
  }
  const money = moneyIn(locale, order.currency);
  const ref = orderReference(order.id);
  const awaiting = order.status === 'awaiting_payment';
  const online = order.method === 'stripe' || order.method === 'paypal';
  const fresh = one(searchParams.new) !== undefined;
  const returnedFromPayment = one(searchParams.paid) !== undefined;
  const track = order.carrier
    ? trackingLink(order.carrier, order.trackingNumber ?? '', order.trackingUrl)
    : null;
  const country = countryNamer(locale);

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <div className="space-y-2">
        <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
        {fresh ? (
          <p className="text-lg">
            {t('thanks', { name: order.buyer.name.split(' ')[0] ?? '', ref })}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            {ref} · {formatDateTime(order.createdAt, timeZone, 'datetime', locale)}
          </span>
          <StatusBadge status={order.status} locale={locale} />
        </div>
      </div>

      {fresh ? (
        <div className={cn('flex flex-wrap items-center justify-between gap-3', S.panel)}>
          <p className="text-sm">{t('keepLink')}</p>
          <CopyLink />
        </div>
      ) : null}

      {awaiting && online ? (
        <div className={cn('space-y-3', S.panel)}>
          {returnedFromPayment ? <p className="text-sm">{t('confirming')}</p> : null}
          {methodsOf(store).includes(order.method) ? (
            <PayNow slug={store.slug} code={order.code} />
          ) : null}
        </div>
      ) : null}

      {awaiting && order.method === 'bank' && store.bank.iban ? (
        <div className={cn('space-y-3', S.panel)}>
          <h2 className={cn('text-lg font-semibold', S.heading)}>{t('bankTitle')}</h2>
          <p className="text-sm">{t('bankBody', { amount: money(order.totalCents) })}</p>
          <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            <dt className={S.muted}>{t('holder')}</dt>
            <dd className="font-medium">{store.bank.holder}</dd>
            <dt className={S.muted}>{t('iban')}</dt>
            <dd className="font-mono font-medium break-all">{formatIban(store.bank.iban)}</dd>
            {store.bank.bankName ? (
              <>
                <dt className={S.muted}>{t('bank')}</dt>
                <dd className="font-medium">{store.bank.bankName}</dd>
              </>
            ) : null}
            <dt className={S.muted}>{t('reference')}</dt>
            <dd className="font-mono font-medium">{ref}</dd>
          </dl>
        </div>
      ) : null}

      {order.method === 'cod' && order.status !== 'delivered' && order.status !== 'cancelled' ? (
        <div className={S.panel}>
          <p className="text-sm">{t('codBody', { amount: money(order.totalCents) })}</p>
        </div>
      ) : null}

      {track || order.trackingNumber ? (
        <div className={cn('space-y-2', S.panel)}>
          {order.trackingNumber ? (
            <p className="text-sm">{t('trackingNumber', { number: order.trackingNumber })}</p>
          ) : null}
          {track ? (
            <a
              href={track}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              {t('track')}
            </a>
          ) : null}
        </div>
      ) : null}

      <div className={cn('space-y-4', S.panel)}>
        <OrderSums order={order} locale={locale} />
        <p className={cn('text-sm', S.muted)}>
          {order.buyer.name} · {order.buyer.addressLine},{' '}
          {order.buyer.postalCode ? `${order.buyer.postalCode} ` : ''}
          {order.buyer.city}, {country(order.buyer.country)}
        </p>
      </div>

      {store.reviewsMode !== 'off' && canReviewOrder(order.status) ? (
        <OrderReviews
          slug={store.slug}
          code={order.code}
          buyerName={order.buyer.name}
          products={(() => {
            const seen = new Set<number>();
            return order.items.flatMap((i) =>
              i.productId !== null && !seen.has(i.productId)
                ? (seen.add(i.productId), [{ id: i.productId, name: i.name }])
                : [],
            );
          })()}
          reviewed={await reviewedProducts(db, order.id)}
        />
      ) : null}

      <p className="text-sm">
        <Link href={`/s/${store.slug}/account`} className="underline">
          {t('accountLink')}
        </Link>
      </p>

      {store.seller.email ? (
        <p className="text-sm">
          {rich(t('questions'), {
            email: (
              <a
                href={`mailto:${store.seller.email}?subject=${encodeURIComponent(ref)}`}
                className="underline"
              >
                {store.seller.email}
              </a>
            ),
          })}
        </p>
      ) : null}
    </ShopFrame>
  );
}
