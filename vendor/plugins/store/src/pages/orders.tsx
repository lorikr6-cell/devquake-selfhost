import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { countryNamer, moneyIn, needArea, ownerScope } from '../components/guard';
import { StatusBadge } from '../components/order-view';
import { listOrders } from '../lib/data';
import { ORDER_STATUSES, orderReference, type OrderStatus } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.orders') };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The shop's orders, newest first, by state. */
export default async function Orders({ ctx, searchParams }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'orders', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'orders');
  const tStatus = translator(locale, 'status');
  const tMethods = translator(locale, 'methods');
  const raw = one(searchParams.status);
  const status = ORDER_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : null;
  const orders = await listOrders(db, store.id, status);
  const country = countryNamer(locale);
  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1.5 text-sm',
      active
        ? 'border-quake bg-quake/10 font-semibold'
        : 'border-ink/15 hover:border-quake dark:border-paper/15',
    );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
      <nav aria-label={t('title')} className="flex flex-wrap gap-2">
        <Link href="/orders" className={chip(status === null)}>
          {t('filterAll')}
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/orders?status=${s}`} className={chip(status === s)}>
            {tStatus(s)}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 hover:bg-quake/5"
              >
                <span className="font-mono text-sm">{orderReference(o.id)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{o.buyerName}</span>
                  <span className="block text-xs text-ink/60 dark:text-paper/60">
                    {[
                      formatDateTime(o.createdAt, timeZone, 'datetime', locale),
                      t('pieces', { count: o.pieces }),
                      tMethods(o.method),
                      country(o.country),
                    ].join(' · ')}
                  </span>
                </span>
                <StatusBadge status={o.status} locale={locale} />
                <span className="w-24 text-right font-semibold">
                  {moneyIn(locale, o.currency)(o.totalCents)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
