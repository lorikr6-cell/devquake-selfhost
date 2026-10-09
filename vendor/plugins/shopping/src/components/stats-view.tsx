'use client';

import { cn, useT } from '@devquake/ui';
import type { PriceChange } from '../lib/prices';
import type { Stats } from '../lib/stats';
import { storeType } from '../lib/store-types';
import { Panel } from './ui';
import { useFormat } from './use-format';

const muted = 'text-ink/60 dark:text-paper/60';

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/70 p-3 dark:border-paper/10 dark:bg-paper/5">
      <p className={`text-xs ${muted}`}>{label}</p>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      {hint ? <p className={`text-xs ${muted}`}>{hint}</p> : null}
    </div>
  );
}

/** The Statistics tab: totals, stores, products, months and how often friends joined. */
export interface PriceStats {
  /** Products with the biggest price changes (first → latest price). */
  changes: PriceChange[];
  /** Average change of all products with one ("my inflation"), in percent. */
  average: number | null;
  /** How far planned prices were from the prices paid. */
  accuracy: { averagePercent: number; items: number } | null;
}

export function StatsView({ stats, prices }: { stats: Stats; prices: PriceStats }) {
  const t = useT('stats');
  const tRoot = useT();
  const percent = (n: number) =>
    `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  const fmt = useFormat();
  const price = (value: number | null, currency: string) =>
    value === null ? '—' : fmt.money(value, currency);
  if (stats.lists === 0) {
    return (
      <Panel>
        <p className={`text-sm ${muted}`}>{t('empty')}</p>
      </Panel>
    );
  }
  const maxMonth = Math.max(...stats.months.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure label={t('lists')} value={String(stats.lists)} />
        <Figure
          label={t('products')}
          value={String(stats.items)}
          hint={t('bought', { count: stats.itemsDone })}
        />
        {stats.money.slice(0, 1).map((m) => (
          <Figure
            key={m.currency}
            label={t('boughtIn', { currency: m.currency })}
            value={fmt.money(m.bought, m.currency)}
            hint={t('ofPlanned', { amount: fmt.money(m.planned, m.currency) })}
          />
        ))}
        <Figure
          label={t('notNeeded')}
          value={String(stats.notNeeded)}
          hint={
            stats.notNeededBought
              ? t('alreadyBought', { count: stats.notNeededBought })
              : t('noneWasted')
          }
        />
      </div>

      {stats.notNeededBought > 0 ? (
        <Panel className="bg-ink/5 dark:bg-black/30">
          <h3 className="font-display text-lg font-semibold">
            {t('wastedTitle')}{' '}
            <span aria-hidden title={t('ohWell')}>
              🙃
            </span>
          </h3>
          <p className={`mt-1 text-sm ${muted}`}>
            {t('wastedIntro')}{' '}
            {stats.money
              .filter((m) => m.wasted > 0)
              .map((m) => t('spentOn', { amount: fmt.money(m.wasted, m.currency) }))
              .join(', ')}
            .
          </p>
          <ul className="mt-2 divide-y divide-ink/5 text-sm dark:divide-paper/10">
            {stats.wastedProducts.map((w) => (
              <li
                key={`${w.name}|${w.unit}|${w.currency}`}
                className="flex justify-between gap-3 py-2"
              >
                <span>
                  <span className="font-medium">{w.name}</span>{' '}
                  <span className={`text-xs ${muted}`}>
                    {w.unit} · {w.times}×
                  </span>
                </span>
                <span className="tabular-nums">{fmt.money(w.amount, w.currency)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <h3 className="font-display text-lg font-semibold">{t('friendsTitle')}</h3>
        <p className={`mt-1 text-sm ${muted}`}>
          {t('friendsIntro', { count: stats.recentLists.length })}
        </p>
        {stats.friends.length === 0 ? (
          <p className={`mt-3 text-sm ${muted}`}>{t('noFriends')}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`text-left text-xs ${muted}`}>
                <tr>
                  <th className="py-1 pr-3 font-medium">{t('person')}</th>
                  <th className="py-1 pr-3 font-medium">{t('joined')}</th>
                  <th className="py-1 pr-3 font-medium">{t('recent')}</th>
                  <th className="py-1 pr-3 font-medium">{t('added')}</th>
                  <th className="py-1 pr-3 font-medium">{t('pickedUp')}</th>
                  <th className="py-1 font-medium">{t('lastTime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
                {stats.friends.map((f) => (
                  <tr key={f.userId}>
                    <td className="py-2 pr-3 font-medium">{f.displayName}</td>
                    <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                      {t('together', { together: f.together, total: stats.lists })}{' '}
                      <span className={muted}>({Math.round(f.share * 100)}%)</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className="flex gap-1"
                        aria-label={t('presence', {
                          count: f.presence.filter(Boolean).length,
                          total: f.presence.length,
                        })}
                      >
                        {f.presence.map((present, i) => (
                          <span
                            key={stats.recentLists[i]!.id}
                            title={t('dot', {
                              name: stats.recentLists[i]!.name,
                              date: stats.recentLists[i]!.shopDate,
                              deleted: stats.recentLists[i]!.deleted ? t('deleted') : '',
                              state: present ? t('wasOn') : t('notOn'),
                            })}
                            className={`size-2.5 rounded-full ${present ? 'bg-quake' : 'border border-ink/25 dark:border-paper/30'}`}
                          />
                        ))}
                      </span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{f.itemsAdded}</td>
                    <td className="py-2 pr-3 tabular-nums">{f.itemsPickedUp}</td>
                    <td className="py-2 whitespace-nowrap">
                      {f.lastDate ? fmt.day(f.lastDate, 'short') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h3 className="font-display text-lg font-semibold">{t('stores')}</h3>
          {stats.stores.length === 0 ? (
            <p className={`mt-2 text-sm ${muted}`}>{t('noStores')}</p>
          ) : (
            <ul className="mt-2 divide-y divide-ink/5 text-sm dark:divide-paper/10">
              {stats.stores.map((s) => (
                <li
                  key={`${s.name}|${s.type}|${s.currency}`}
                  className="flex justify-between gap-3 py-2"
                >
                  <span>
                    <span className="font-medium">{s.name}</span>{' '}
                    <span className={`text-xs ${muted}`}>
                      {tRoot(`storeTypes.${storeType(s.type).code}.label`)} ·{' '}
                      {t('productCount', { count: s.items })}
                    </span>
                  </span>
                  <span className="tabular-nums">{fmt.money(s.total, s.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <h3 className="font-display text-lg font-semibold">{t('perMonth')}</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {stats.months.map((m) => (
              <li key={`${m.month}|${m.currency}`}>
                <div className="flex justify-between">
                  <span>
                    {fmt.month(`${m.month}-01`)}{' '}
                    <span className={`text-xs ${muted}`}>
                      {tRoot('calendar.lists', { count: m.lists })}
                    </span>
                  </span>
                  <span className="tabular-nums">{fmt.money(m.total, m.currency)}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-ink/10 dark:bg-paper/15">
                  <div
                    className="h-full rounded-full bg-quake"
                    style={{ width: `${Math.round((m.total / maxMonth) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <h3 className="font-display text-lg font-semibold">{t('topProducts')}</h3>
        <p className={`mt-1 text-sm ${muted}`}>{t('perUnit')}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`text-left text-xs ${muted}`}>
              <tr>
                <th className="py-1 pr-3 font-medium">{t('product')}</th>
                <th className="py-1 pr-3 font-medium">{t('times')}</th>
                <th className="py-1 pr-3 font-medium">{t('average')}</th>
                <th className="py-1 pr-3 font-medium">{t('lowest')}</th>
                <th className="py-1 pr-3 font-medium">{t('highest')}</th>
                <th className="py-1 font-medium">{t('lastPrice')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 tabular-nums dark:divide-paper/10">
              {stats.products.map((p) => (
                <tr key={`${p.name}|${p.unit}|${p.currency}`}>
                  <td className="py-2 pr-3 font-medium">
                    {p.name} {p.unit ? <span className={`text-xs ${muted}`}>{p.unit}</span> : null}
                  </td>
                  <td className="py-2 pr-3">{p.times}</td>
                  <td className="py-2 pr-3">{price(p.avgPrice, p.currency)}</td>
                  <td className="py-2 pr-3">{price(p.minPrice, p.currency)}</td>
                  <td className="py-2 pr-3">{price(p.maxPrice, p.currency)}</td>
                  <td className="py-2">{price(p.lastPrice, p.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <h3 className="font-display text-lg font-semibold">{t('pricesTitle')}</h3>
        <p className={`mt-1 text-sm ${muted}`}>{t('pricesIntro')}</p>
        {prices.average !== null || prices.accuracy ? (
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {prices.average !== null ? (
              <Figure
                label={t('inflation')}
                value={percent(prices.average)}
                hint={t('inflationHint', { count: prices.changes.length })}
              />
            ) : null}
            {prices.accuracy ? (
              <Figure
                label={t('vsPlanned')}
                value={percent(prices.accuracy.averagePercent)}
                hint={t('vsPlannedHint', { count: prices.accuracy.items })}
              />
            ) : null}
          </dl>
        ) : null}
        {prices.changes.length === 0 ? (
          <p className={`mt-3 text-sm ${muted}`}>{t('pricesEmpty')}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`text-left text-xs ${muted}`}>
                <tr>
                  <th className="py-1 pr-3 font-medium">{t('product')}</th>
                  <th className="py-1 pr-3 font-medium">{t('firstPrice')}</th>
                  <th className="py-1 pr-3 font-medium">{t('latestPrice')}</th>
                  <th className="py-1 font-medium">{t('change')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 tabular-nums dark:divide-paper/10">
                {prices.changes.map((c) => (
                  <tr key={`${c.product}|${c.unit}|${c.currency}`}>
                    <td className="py-2 pr-3 font-medium">
                      {c.product}{' '}
                      {c.unit ? <span className={`text-xs ${muted}`}>{c.unit}</span> : null}
                    </td>
                    <td className="py-2 pr-3">
                      {fmt.money(c.first.price, c.currency)}
                      <span className={`block text-xs ${muted}`}>
                        {fmt.day(c.first.on, 'short')}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      {fmt.money(c.last.price, c.currency)}
                      <span className={`block text-xs ${muted}`}>
                        {fmt.day(c.last.on, 'short')}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'py-2 font-medium',
                        c.changePercent > 0 && 'text-red-700 dark:text-red-400',
                        c.changePercent < 0 && 'text-emerald-700 dark:text-emerald-400',
                      )}
                    >
                      {percent(c.changePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
