import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { SubscriberList } from '../components/newsletter-editor';
import { SubNav } from '../components/sub-nav';
import { Notice, Panel } from '../components/ui';
import { shopMailConfigured } from '../lib/mailer';
import { listNewsletters, listSubscribers, subscriberCounts } from '../lib/newsletter-data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.newsletters') };
}

const STATUS_TONE = {
  draft: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
  sending: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200',
  sent: 'bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200',
} as const;

/** Email campaigns to the shop's subscribers, and the subscribers themselves. */
export default async function NewslettersPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'marketing', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'newsletters');
  const [newsletters, counts, subscribers] = await Promise.all([
    listNewsletters(db, store.id),
    subscriberCounts(db, store.id),
    listSubscribers(db, store.id, null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
        </div>
        <Link href="/newsletters/new" className={buttonClass('primary')}>
          {t('new')}
        </Link>
      </div>
      <SubNav group="marketing" current="/newsletters" roles={roles} locale={locale} />
      {!shopMailConfigured() ? (
        <Notice title={t('mailOffTitle')}>
          <p>{t('mailOffBody')}</p>
        </Notice>
      ) : null}

      <dl className="grid grid-cols-3 gap-3">
        {(
          [
            ['confirmed', counts.confirmed],
            ['pending', counts.pending],
            ['unsubscribed', counts.unsubscribed],
          ] as const
        ).map(([k, n]) => (
          <div
            key={k}
            className="rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5"
          >
            <dt className="text-xs text-ink/60 dark:text-paper/60">{t(`counts.${k}`)}</dt>
            <dd className="font-display text-2xl font-bold">{n}</dd>
          </div>
        ))}
      </dl>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">{t('campaigns')}</h2>
        {newsletters.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
            {newsletters.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/newsletters/${n.id}`}
                  className="flex flex-wrap items-center gap-3 p-3 hover:bg-quake/5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{n.subject}</span>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {t('productCount', { count: n.products.length })}
                      {n.status !== 'draft'
                        ? ` · ${t('progress', { sent: n.sentCount, total: n.recipients })}`
                        : ''}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      STATUS_TONE[n.status],
                    )}
                  >
                    {t(`status.${n.status}`)}
                  </span>
                  <span className="text-xs text-ink/60 dark:text-paper/60">
                    {formatDateTime(n.sentAt ?? n.createdAt, timeZone, 'datetime', locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold">{t('subscribers')}</h2>
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('subscribersHint')}</p>
          </div>
          {counts.confirmed > 0 ? (
            <a href="/api/subscribers" className={buttonClass('secondary')} download>
              {t('export')}
            </a>
          ) : null}
        </div>
        <SubscriberList
          subscribers={subscribers.map((s) => ({
            id: s.id,
            email: s.email,
            status: s.status,
            source: s.source,
            date: formatDateTime(s.confirmedAt ?? s.createdAt, timeZone, 'date', locale),
          }))}
        />
      </Panel>
    </div>
  );
}
