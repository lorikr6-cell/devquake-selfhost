import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { appIcons } from '../components/app-icons';
import { CustomerActions } from '../components/customer-actions';
import { moneyIn, needArea, ownerScope } from '../components/guard';
import { customerDetail } from '../lib/customers-data';
import { orderReference } from '../lib/model';
import { canManageCustomers } from '../lib/roles';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.customers'), icons: await appIcons(ctx) };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const listClass =
  'divide-y divide-ink/10 rounded-xl border border-ink/10 text-sm dark:divide-paper/10 dark:border-paper/10';

/**
 * One customer (ADR 0064): their account, orders, reviews (and whether the shop answered),
 * interest votes, favourites and conversations (open or resolved); the owner and managers can
 * block them or delete their account.
 */
export default async function CustomerPage({ ctx, params }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'customers', locale);
  if (missing || !store) return missing;
  const c = await customerDetail(db, store.id, params.key ?? '');
  if (!c) notFound();
  const t = translator(locale, 'customers');
  const money = moneyIn(locale, store.currency);
  const date = (v: string | null) => (v ? formatDateTime(v, timeZone, 'date', locale) : '—');
  const none = <p className="text-sm text-ink/60 dark:text-paper/60">{t('none')}</p>;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Link href="/customers" className="text-sm underline">
          ← {t('back')}
        </Link>
        <h1 className="font-display text-3xl font-bold break-words">
          {c.name ?? c.email ?? t('memberKey', { id: c.key.slice(1) })}
        </h1>
        <p className="text-sm text-ink/70 dark:text-paper/70">
          {c.email && c.name ? `${c.email} · ` : ''}
          {c.member ? t('member') : t('buyer')}
          {c.joinedAt ? ` · ${t('joined', { date: date(c.joinedAt) })}` : ''}
          {c.lastSeenAt ? ` · ${t('seen', { date: date(c.lastSeenAt) })}` : ''}
        </p>
        {c.blocked ? (
          <p className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-900 dark:bg-red-950 dark:text-red-100">
            {t('blocked')}
          </p>
        ) : null}
      </div>
      {canManageCustomers(roles) ? (
        <CustomerActions
          customerKey={c.key}
          name={c.name ?? c.email ?? t('memberKey', { id: c.key.slice(1) })}
          blocked={c.blocked}
          account={c.key.startsWith('b')}
        />
      ) : null}

      <Section title={t('conversationsTitle', { count: c.threadList.length })}>
        {c.threadList.length === 0 ? (
          none
        ) : (
          <ul className={listClass}>
            {c.threadList.map((th) => (
              <li key={th.id}>
                <Link
                  href={`/messages/${th.id}`}
                  className="flex flex-wrap items-center gap-3 p-3 hover:bg-quake/5"
                >
                  <span className="min-w-0 flex-1 truncate">{th.subject}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs',
                      th.status === 'closed'
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
                        : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
                    )}
                  >
                    {th.status === 'closed'
                      ? t('resolved')
                      : th.answered
                        ? t('answered')
                        : t('waiting')}
                  </span>
                  <span className="text-xs text-ink/60 dark:text-paper/60">{date(th.lastAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('reviewsTitle', { count: c.reviewList.length })}>
        {c.reviewList.length === 0 ? (
          none
        ) : (
          <ul className={listClass}>
            {c.reviewList.map((r) => (
              <li key={r.id} className="space-y-1 p-3">
                <p className="font-medium">
                  {r.product} · {'★'.repeat(r.rating)}
                  <span className="text-ink/30 dark:text-paper/30">{'★'.repeat(5 - r.rating)}</span>
                </p>
                {r.title ? <p className="font-medium">{r.title}</p> : null}
                {r.body ? (
                  <p className="whitespace-pre-line text-ink/80 dark:text-paper/80">{r.body}</p>
                ) : null}
                <p className="text-xs text-ink/60 dark:text-paper/60">
                  {date(r.createdAt)} · {t(`reviewStatus.${r.status}`)} ·{' '}
                  {r.replied ? t('replied') : t('notReplied')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('votesTitle', { count: c.voteList.length })}>
        {c.voteList.length === 0 ? (
          none
        ) : (
          <ul className={listClass}>
            {c.voteList.map((v, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 p-3">
                <span className="min-w-0 flex-1">{v.product}</span>
                <span className="text-xs">
                  {v.interested ? t('wantsIt') : t('notForThem')}
                  {v.interested && (v.minCents !== null || v.maxCents !== null)
                    ? ` · ${v.minCents !== null ? money(v.minCents) : '…'} – ${v.maxCents !== null ? money(v.maxCents) : '…'}`
                    : ''}
                </span>
                <span className="text-xs text-ink/60 dark:text-paper/60">{date(v.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('favoritesTitle', { count: c.favoriteList.length })}>
        {c.favoriteList.length === 0 ? (
          none
        ) : (
          <ul className={listClass}>
            {c.favoriteList.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 p-3">
                <span
                  className={cn(
                    'min-w-0 flex-1',
                    f.state !== 'available' && 'line-through opacity-70',
                  )}
                >
                  {f.name}
                </span>
                <span className="text-xs">
                  {money(f.priceCents)}
                  {f.nowCents !== null && f.nowCents !== f.priceCents
                    ? ` → ${money(f.nowCents)}`
                    : ''}
                </span>
                <span className="text-xs text-ink/60 dark:text-paper/60">{date(f.addedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('ordersTitle', { count: c.orderList.length })}>
        {c.orderList.length === 0 ? (
          none
        ) : (
          <ul className={listClass}>
            {c.orderList.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex flex-wrap items-center gap-3 p-3 hover:bg-quake/5"
                >
                  <span className="font-mono text-xs">{orderReference(o.id)}</span>
                  <span className="min-w-0 flex-1 truncate">{o.names.join(', ')}</span>
                  <span className="tabular-nums">{moneyIn(locale, o.currency)(o.totalCents)}</span>
                  <span className="text-xs text-ink/60 dark:text-paper/60">
                    {date(o.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
