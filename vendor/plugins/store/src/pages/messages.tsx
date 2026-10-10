import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { threadsOfStore } from '../lib/buyers-data';
import { orderReference } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.messages') };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Buyers' messages to the shop: unread first, open conversations, or all. */
export default async function MessagesPage({ ctx, searchParams }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'messages', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'inbox');
  const asked = one(searchParams.filter);
  const filter = asked === 'unread' || asked === 'all' ? asked : 'open';
  const threads = await threadsOfStore(db, store.id, filter);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <nav aria-label={t('filter')} className="flex flex-wrap gap-2">
        {(['open', 'unread', 'all'] as const).map((f) => (
          <Link
            key={f}
            href={`/messages?filter=${f}`}
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
      {threads.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {threads.map((th) => (
            <li key={th.id}>
              <Link
                href={`/messages/${th.id}`}
                className="flex flex-wrap items-center gap-3 p-3 hover:bg-quake/5"
              >
                {th.unread ? (
                  <span className="size-2.5 rounded-full bg-quake" aria-label={t('unread')} />
                ) : null}
                <span className={cn('min-w-0 flex-1', th.unread && 'font-semibold')}>
                  <span className="block truncate">{th.subject}</span>
                  <span className="block truncate text-xs font-normal text-ink/60 dark:text-paper/60">
                    {th.buyerName ?? th.buyerEmail}
                    {th.orderId ? ` · ${orderReference(th.orderId)}` : ''} · {th.lastMessage}
                  </span>
                </span>
                {th.status === 'closed' ? (
                  <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs dark:bg-paper/10">
                    {t('closed')}
                  </span>
                ) : null}
                <span className="text-xs text-ink/60 dark:text-paper/60">
                  {formatDateTime(th.lastAt, timeZone, 'datetime', locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
