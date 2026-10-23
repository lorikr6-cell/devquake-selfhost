import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { appIcons } from '../components/app-icons';
import { needArea, ownerScope } from '../components/guard';
import { listCustomers, type CustomerFilter } from '../lib/customers-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.customers'), icons: await appIcons(ctx) };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const FILTERS: CustomerFilter[] = ['all', 'buyers', 'members', 'open', 'blocked'];

/**
 * The shop's customers (ADR 0064): buyer accounts and DevQuake members who voted or saved
 * favourites, with their orders, reviews, votes, favourites and conversations (open or resolved).
 */
export default async function CustomersPage({ ctx, searchParams }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'customers', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'customers');
  const asked = one(searchParams.filter) as CustomerFilter | undefined;
  const filter = asked && FILTERS.includes(asked) ? asked : 'all';
  const search = (one(searchParams.q) ?? '').trim().slice(0, 80);
  const rows = await listCustomers(db, store.id, filter, search);
  const date = (v: string | null) => (v ? formatDateTime(v, timeZone, 'date', locale) : '—');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label={t('filter')} className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={`/customers?filter=${f}`}
              aria-current={filter === f ? 'page' : undefined}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm',
                filter === f
                  ? 'border-quake bg-quake/10 font-semibold'
                  : 'border-ink/15 hover:border-quake dark:border-paper/15',
              )}
            >
              {t(`filters.${f}`)}
            </Link>
          ))}
        </nav>
        <form data-dq-submit="always" className="ml-auto flex gap-2" role="search">
          <input type="hidden" name="filter" value={filter} />
          <label className="sr-only" htmlFor="customer-search">
            {t('search')}
          </label>
          <input
            id="customer-search"
            name="q"
            defaultValue={search}
            maxLength={80}
            placeholder={t('search')}
            className="min-h-9 rounded-md border border-ink/15 bg-white px-3 text-sm dark:border-paper/15 dark:bg-ink"
          />
        </form>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink/10 dark:border-paper/10">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="border-b border-ink/10 text-left text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
              <tr>
                <th className="px-3 py-2 font-medium">{t('who')}</th>
                <th className="px-3 py-2 font-medium">{t('lastSeen')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('orders')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('reviews')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('votes')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('favorites')}</th>
                <th className="px-3 py-2 font-medium">{t('conversations')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 dark:divide-paper/10">
              {rows.map((c) => (
                <tr key={c.key} className={cn(c.blocked && 'opacity-60')}>
                  <td className="px-3 py-2">
                    <Link
                      href={`/customers/${c.key}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {c.name ?? c.email ?? t('memberKey', { id: c.key.slice(1) })}
                    </Link>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {c.email && c.name ? `${c.email} · ` : ''}
                      {c.member ? t('member') : t('buyer')}
                      {c.blocked ? ` · ${t('blocked')}` : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{date(c.lastSeenAt ?? c.joinedAt)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.orders}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.reviews}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.votes}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.favorites}</td>
                  <td className="px-3 py-2 text-xs">
                    {c.openThreads + c.closedThreads === 0
                      ? '—'
                      : t('threadsState', { open: c.openThreads, closed: c.closedThreads })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
