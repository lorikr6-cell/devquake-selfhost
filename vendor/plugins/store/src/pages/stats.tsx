import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { BarChart } from '../components/bar-chart';
import { moneyIn, needArea, ownerScope } from '../components/guard';
import { Panel } from '../components/ui';
import { PERIODS, bucket, bucketSize, parsePeriod } from '../lib/stats';
import { storeStats } from '../lib/stats-data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.stats') };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const SORTS = ['revenue', 'units', 'views', 'conversion', 'rating'] as const;
type Sort = (typeof SORTS)[number];

/**
 * The shop's numbers for a period: sales, orders, average order, views and conversion with the
 * change against the period before; sales, orders and views by day (or week); and every
 * product's views, sales, conversion, rating and stock.
 */
export default async function StatsPage({ ctx, searchParams }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale } = scope;
  const missing = needArea(store, roles, 'stats', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'stats');
  const tMethods = translator(locale, 'methods');
  const period = parsePeriod(one(searchParams.days));
  const sortAsked = one(searchParams.sort);
  const sort: Sort = SORTS.includes(sortAsked as Sort) ? (sortAsked as Sort) : 'revenue';
  const s = await storeStats(db, store.id, period, new Date());
  const money = moneyIn(locale, store.currency);
  const tag = LOCALE_TAGS[locale];
  const size = bucketSize(period);
  const dayLabel = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString(tag, {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
    });
  const labels = s.days.filter((_, i) => i % size === 0).map(dayLabel);
  const tableLabels = { period: t('day'), value: t('value'), show: t('showTable') };

  const change = (value: number | null) =>
    value === null ? null : (
      <span
        className={cn(
          'text-xs font-medium',
          value > 0
            ? 'text-green-700 dark:text-green-400'
            : value < 0
              ? 'text-red-700 dark:text-red-400'
              : 'text-ink/60',
        )}
      >
        {value > 0 ? '▲' : value < 0 ? '▼' : '•'} {t('change', { value: Math.abs(value) })}
      </span>
    );

  const tiles: Array<[string, string, ReturnType<typeof change>]> = [
    [t('revenue'), money(s.revenueCents), change(s.changes.revenue)],
    [t('orders'), s.orders.toLocaleString(tag), change(s.changes.orders)],
    [t('average'), money(s.averageCents), null],
    [t('units'), s.units.toLocaleString(tag), null],
    [t('views'), s.views.toLocaleString(tag), change(s.changes.views)],
    [t('conversion'), s.conversion === null ? '—' : `${s.conversion.toLocaleString(tag)} %`, null],
    [t('discounts'), money(s.discountCents), null],
    [t('subscribers'), s.subscribers.toLocaleString(tag), null],
  ];

  const products = [...s.products].sort((a, b) =>
    sort === 'units'
      ? b.units - a.units
      : sort === 'views'
        ? b.views - a.views
        : sort === 'conversion'
          ? (b.conversion ?? -1) - (a.conversion ?? -1)
          : sort === 'rating'
            ? b.rating - a.rating || b.reviews - a.reviews
            : b.revenueCents - a.revenueCents,
  );
  const maxRevenue = Math.max(1, ...s.categories.map((c) => c.revenueCents));
  const link = (days: number, by: Sort) => `/stats?days=${days}&sort=${by}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
        </div>
        <nav aria-label={t('period')} className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={link(p, sort)}
              aria-current={p === period ? 'page' : undefined}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm',
                p === period
                  ? 'border-quake bg-quake/10 font-semibold'
                  : 'border-ink/15 hover:border-quake dark:border-paper/15',
              )}
            >
              {t('days', { count: p })}
            </Link>
          ))}
        </nav>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([label, value, delta]) => (
          <div
            key={label}
            className="rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5"
          >
            <dt className="text-xs text-ink/60 dark:text-paper/60">{label}</dt>
            <dd className="font-display text-2xl font-bold tabular-nums">{value}</dd>
            {delta ? <dd>{delta}</dd> : null}
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <BarChart
            title={size > 1 ? t('revenueByWeek') : t('revenueByDay')}
            labels={labels}
            values={bucket(s.daily.revenueCents, size)}
            currency={store.currency}
            tableLabels={tableLabels}
          />
        </Panel>
        <Panel>
          <BarChart
            title={size > 1 ? t('ordersByWeek') : t('ordersByDay')}
            labels={labels}
            values={bucket(s.daily.orders, size)}
            tableLabels={tableLabels}
          />
        </Panel>
        <Panel>
          <BarChart
            title={size > 1 ? t('viewsByWeek') : t('viewsByDay')}
            labels={labels}
            values={bucket(s.daily.views, size)}
            tableLabels={tableLabels}
          />
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{t('byCategory')}</h2>
          {s.categories.length === 0 ? (
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('noSales')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {s.categories.map((c) => (
                <li key={c.category ?? '-'} className="space-y-1">
                  <div className="flex justify-between gap-2">
                    <span>{c.category ?? t('noCategory')}</span>
                    <span className="tabular-nums">
                      {money(c.revenueCents)} · {t('unitsShort', { count: c.units })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
                    <div
                      className="h-full rounded-full bg-quake"
                      style={{ width: `${(c.revenueCents / maxRevenue) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{t('byMethod')}</h2>
          {s.methods.length === 0 ? (
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('noSales')}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {s.methods.map((m) => (
                  <tr
                    key={m.method}
                    className="border-t border-ink/10 first:border-0 dark:border-paper/10"
                  >
                    <td className="py-1.5">{tMethods(m.method)}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {t('ordersShort', { count: m.orders })}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{money(m.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-ink/60 dark:text-paper/60">
            {t('extra', {
              cancelled: s.cancelled,
              vouchers: s.voucherOrders,
              buyers: s.buyers,
            })}
          </p>
        </Panel>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">{t('products')}</h2>
          <nav aria-label={t('sortBy')} className="flex flex-wrap gap-1 text-xs">
            {SORTS.map((x) => (
              <Link
                key={x}
                href={link(period, x)}
                aria-current={x === sort ? 'true' : undefined}
                className={cn(
                  'rounded-full border px-2.5 py-1',
                  x === sort
                    ? 'border-quake bg-quake/10 font-semibold'
                    : 'border-ink/15 dark:border-paper/15',
                )}
              >
                {t(`sort.${x}`)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="overflow-x-auto rounded-xl border border-ink/10 dark:border-paper/10">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-ink/5 text-left text-xs dark:bg-paper/5">
              <tr>
                <th className="px-3 py-2 font-medium">{t('product')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('views')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('orders')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('units')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('revenue')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('conversion')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('rating')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('stock')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.productId} className="border-t border-ink/10 dark:border-paper/10">
                  <td className="px-3 py-2">
                    <Link href={`/products/${p.productId}`} className="hover:text-quake">
                      {p.name}
                    </Link>
                    {!p.published ? (
                      <span className="ml-2 text-xs text-ink/60 dark:text-paper/60">
                        {t('draft')}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {p.views.toLocaleString(tag)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {p.orders.toLocaleString(tag)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {p.units.toLocaleString(tag)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(p.revenueCents)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {p.conversion === null ? '—' : `${p.conversion.toLocaleString(tag)} %`}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {p.reviews ? `${p.rating.toLocaleString(tag)} (${p.reviews})` : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right tabular-nums',
                      p.stock === 0 && 'font-semibold text-red-700 dark:text-red-400',
                    )}
                  >
                    {p.stock === null ? '∞' : p.stock.toLocaleString(tag)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('note')}</p>
      </section>
    </div>
  );
}
