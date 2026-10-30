import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { addDays, todayIn } from '../lib/dates';
import { salesDays, searchBills, topItems } from '../lib/floor';
import { formatMinor } from '../lib/model';
import { purchases, topPurchases, venueLink } from '../lib/links';
import { ownVenue } from '../lib/page';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('nav.reports'), robots: { index: false } };
}

/**
 * Sales and income (the owner's): by day for a month, its totals by payment, the best-selling
 * items, and a search through the bills of the last six months (?q=).
 */
export default async function Reports({ ctx, searchParams }: PluginPageProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  const { venue, db } = own;
  const today = todayIn(ctx.timeZone || 'UTC');
  const raw = typeof searchParams.month === 'string' ? searchParams.month : '';
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : today.slice(0, 7);
  const first = `${month}-01`;
  const [y, m] = month.split('-').map(Number) as [number, number];
  const nextFirst = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const last = addDays(nextFirst, -1);
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim().slice(0, 60) : '';
  const [days, items, bills, list] = await Promise.all([
    salesDays(db, venue.id, first, last),
    topItems(db, venue.id, month, month),
    searchBills(db, venue.id, q, 50),
    venueLink(db, venue.id, 'shoppingList'),
  ]);
  // The month's costs: what was bought on the venue's purchasing list in Shopping (ADR 0035).
  const bought =
    list && ctx.links
      ? await purchases(ctx.links, Number(list.ref), first, last).catch(() => null)
      : null;
  const listUrl =
    list && ctx.links
      ? ctx.links.deepLink('shopping', 'list', { id: list.ref }, { returnTo: '/reports' })
      : null;
  const money = (m: number) => `${formatMinor(m, venue.decimals)} ${venue.currency}`;
  const sum = (k: 'gross' | 'net' | 'tip' | 'cash' | 'card' | 'other' | 'bills') =>
    days.reduce((a, d) => a + d[k], 0);
  const tag = LOCALE_TAGS[locale];
  const monthName = new Intl.DateTimeFormat(tag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${first}T00:00:00Z`));
  const prev = addDays(first, -1).slice(0, 7);
  const next = addDays(last, 1).slice(0, 7);
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">
          {t('nav.reports')} · {monthName}
        </h1>
        <nav className="flex gap-3 text-sm">
          <a href={`?month=${prev}`} className="underline">
            ← {t('reports.prev')}
          </a>
          {next <= today.slice(0, 7) ? (
            <a href={`?month=${next}`} className="underline">
              {t('reports.next')} →
            </a>
          ) : null}
        </nav>
      </header>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['gross', sum('gross')],
            ['net', sum('net')],
            ['vat', sum('gross') - sum('net')],
            ['tips', sum('tip')],
            ['cash', sum('cash')],
            ['card', sum('card')],
            ['other', sum('other')],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-lg border border-ink/10 p-3 dark:border-paper/10">
            <p className="text-xs text-ink/60 dark:text-paper/60">{t(`reports.${k}`)}</p>
            <p className="text-lg font-semibold tabular-nums">{money(v)}</p>
          </div>
        ))}
        <div className="rounded-lg border border-ink/10 p-3 dark:border-paper/10">
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('reports.bills')}</p>
          <p className="text-lg font-semibold tabular-nums">{sum('bills')}</p>
        </div>
      </section>
      {list ? (
        <section className="space-y-2 rounded-lg border border-ink/10 p-4 dark:border-paper/10">
          <h2 className="font-semibold">{t('reports.costsTitle', { name: list.name })}</h2>
          {bought ? (
            <>
              <p className="flex flex-wrap justify-between gap-3">
                <span>{t('reports.purchases')}</span>
                <span className="font-semibold tabular-nums">
                  {bought.total.toFixed(2)} {bought.currency}
                </span>
              </p>
              {bought.currency === venue.currency ? (
                <p className="flex flex-wrap justify-between gap-3">
                  <span>{t('reports.afterCosts')}</span>
                  <span className="font-semibold tabular-nums">
                    {money(sum('gross') - Math.round(bought.total * 10 ** venue.decimals))}
                  </span>
                </p>
              ) : null}
              <ol className="space-y-0.5 text-sm">
                {topPurchases(bought.items).map((p) => (
                  <li key={p.name} className="flex justify-between gap-3">
                    <span>{p.name}</span>
                    <span className="tabular-nums">{p.total.toFixed(2)}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-sm text-ink/70 dark:text-paper/70">
              {t('reports.costsUnavailable')}
            </p>
          )}
          {listUrl ? (
            <a href={listUrl} className="text-sm underline">
              {t('reports.openList')}
            </a>
          ) : null}
        </section>
      ) : null}
      <section>
        <h2 className="mb-2 font-semibold">{t('reports.byDay')}</h2>
        {days.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/60 dark:text-paper/60">
                <th className="py-1">{t('reports.day')}</th>
                <th className="text-right">{t('reports.bills')}</th>
                <th className="text-right">{t('reports.gross')}</th>
                <th className="text-right">{t('reports.tips')}</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.day} className="border-t border-ink/10 dark:border-paper/10">
                  <td className="py-1">
                    {new Date(`${d.day}T12:00:00Z`).toLocaleDateString(tag, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'UTC',
                    })}
                  </td>
                  <td className="text-right tabular-nums">{d.bills}</td>
                  <td className="text-right tabular-nums">{money(d.gross)}</td>
                  <td className="text-right tabular-nums">{money(d.tip)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-ink/70 dark:text-paper/70">{t('reports.noSales')}</p>
        )}
      </section>
      <section>
        <h2 className="mb-2 font-semibold">{t('reports.topItems')}</h2>
        {items.length ? (
          <ol className="space-y-1 text-sm">
            {items.slice(0, 20).map((i) => (
              <li key={i.name} className="flex justify-between gap-3">
                <span>
                  {i.qty}× {i.name}
                </span>
                <span className="tabular-nums">{money(i.gross)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-ink/70 dark:text-paper/70">{t('reports.noSales')}</p>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">{t('reports.billsTitle')}</h2>
        <form className="flex flex-wrap gap-2">
          <input type="hidden" name="month" value={month} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t('reports.search')}
            aria-label={t('reports.search')}
            className="w-full max-w-sm rounded-md border border-ink/20 bg-white px-3 py-2 dark:border-paper/20 dark:bg-zinc-900"
          />
          <button type="submit" className="rounded-md bg-quake px-4 py-2 font-medium text-white">
            {t('reports.searchButton')}
          </button>
        </form>
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('reports.keep')}</p>
        {bills.length ? (
          <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
            {bills.map((b) => (
              <li key={b.id} className="flex flex-wrap items-baseline gap-3 py-2">
                <a href={`/b/${b.code}`} className="font-medium underline">
                  {b.tableName ?? '—'}
                </a>
                <span className="text-ink/60 dark:text-paper/60">
                  {formatDateTime(b.openedAt, ctx.timeZone || 'UTC', 'datetime', locale)} ·{' '}
                  {b.openedBy}
                </span>
                <span className="ml-auto tabular-nums">
                  {b.status === 'final'
                    ? `${money(b.gross + b.tip)} · ${t(`table.pay.${b.payment ?? 'other'}`)}`
                    : t('reports.open')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink/70 dark:text-paper/70">{t('reports.noBills')}</p>
        )}
      </section>
    </div>
  );
}
