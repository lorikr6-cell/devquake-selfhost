import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { OrderStatusButtons, TrackingForm } from '../components/order-actions';
import { OrderSums, StatusBadge } from '../components/order-view';
import { countryNamer, needArea, ownerScope } from '../components/guard';
import { Panel } from '../components/ui';
import { orderById } from '../lib/data';
import { nextStatuses, orderReference, trackingLink } from '../lib/model';

export function generateMetadata({ ctx, params }: PluginPageProps) {
  return {
    title: translator(localeOf(ctx))('meta.order', { ref: orderReference(Number(params.id) || 0) }),
  };
}

/** One order for the owner: buyer, address, items, payment, moving it on, shipping. */
export default async function OrderPage({ ctx, params }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'orders', locale);
  if (missing || !store) return missing;
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const order = await orderById(db, store.id, id);
  if (!order) notFound();
  const t = translator(locale, 'order');
  const country = countryNamer(locale);
  const when = (iso: string | null) =>
    iso ? formatDateTime(iso, timeZone, 'datetime', locale) : null;
  const ref = orderReference(order.id);
  const track = order.carrier
    ? trackingLink(order.carrier, order.trackingNumber ?? '', order.trackingUrl)
    : null;
  const b = order.buyer;
  const history = [
    [t('placed', { date: when(order.createdAt) ?? '' }), true],
    [t('paidAt', { date: when(order.paidAt) ?? '' }), order.paidAt],
    [t('shippedAt', { date: when(order.shippedAt) ?? '' }), order.shippedAt],
    [t('deliveredAt', { date: when(order.deliveredAt) ?? '' }), order.deliveredAt],
    [t('cancelledAt', { date: when(order.cancelledAt) ?? '' }), order.cancelledAt],
  ].filter(([, on]) => on) as Array<[string, unknown]>;

  return (
    <div className="space-y-6">
      <BackLink href="/orders">{t('back')}</BackLink>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">{t('title', { ref })}</h1>
        <StatusBadge status={order.status} locale={locale} />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/70 dark:text-paper/70">
        {history.map(([text]) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
      <OrderStatusButtons orderId={order.id} next={nextStatuses(order.status, order.method)} />

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="space-y-1 text-sm">
          <h2 className="font-display text-lg font-semibold">{t('buyer')}</h2>
          <p className="font-medium">{b.name}</p>
          <p>
            <a
              href={`mailto:${b.email}?subject=${encodeURIComponent(`${store.name} ${ref}`)}`}
              className="text-quake underline"
            >
              {b.email}
            </a>
          </p>
          {b.phone ? (
            <p>
              <a href={`tel:${b.phone.replace(/[^\d+]/g, '')}`} className="underline">
                {b.phone}
              </a>
            </p>
          ) : null}
        </Panel>
        <Panel className="space-y-1 text-sm">
          <h2 className="font-display text-lg font-semibold">{t('address')}</h2>
          <p>{b.addressLine}</p>
          <p>
            {b.postalCode ? `${b.postalCode} ` : ''}
            {b.city}
          </p>
          <p>{country(b.country)}</p>
        </Panel>
      </div>

      {b.note ? (
        <Panel className="space-y-1 text-sm">
          <h2 className="font-display text-lg font-semibold">{t('note')}</h2>
          <p className="whitespace-pre-line">{b.note}</p>
        </Panel>
      ) : null}

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('items')}</h2>
        <OrderSums order={order} locale={locale} />
        {order.providerRef ? (
          <p className="text-xs text-ink/60 dark:text-paper/60">
            {t('providerRef')}: <span className="font-mono break-all">{order.providerRef}</span>
          </p>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('tracking')}</h2>
        <TrackingForm
          orderId={order.id}
          carrier={order.carrier}
          number={order.trackingNumber}
          url={order.trackingUrl}
        />
        {track ? (
          <a
            href={track}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-quake underline"
          >
            {t('openTracking')}
          </a>
        ) : null}
      </Panel>

      <Link
        href={`/s/${store.slug}/orders/${order.code}`}
        className="inline-block text-sm underline hover:text-quake"
      >
        {t('buyerPage')}
      </Link>
    </div>
  );
}
