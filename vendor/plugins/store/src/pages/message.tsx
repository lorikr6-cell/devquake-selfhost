import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { ThreadActions } from '../components/thread-actions';
import { Panel } from '../components/ui';
import { openThread } from '../lib/buyers-data';
import { can } from '../lib/roles';
import { orderReference } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.messages') };
}

/** A conversation with a buyer: their messages and the team's answers (emailed to them). */
export default async function MessagePage({ ctx, params }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'messages', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'inbox');
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const thread = await openThread(db, store.id, id, { shop: true });
  if (!thread) notFound();
  return (
    <div className="space-y-6">
      <BackLink href="/messages">{t('title')}</BackLink>
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold break-words">{thread.subject}</h1>
        <p className="text-sm text-ink/70 dark:text-paper/70">
          {thread.buyerName ? `${thread.buyerName} · ` : ''}
          <a href={`mailto:${thread.buyerEmail}`} className="underline hover:text-quake">
            {thread.buyerEmail}
          </a>
          {thread.orderId && can(roles, 'orders') ? (
            <>
              {' · '}
              <Link href={`/orders/${thread.orderId}`} className="underline hover:text-quake">
                {orderReference(thread.orderId)}
              </Link>
            </>
          ) : null}
        </p>
      </div>
      <ol className="space-y-3">
        {thread.messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              'max-w-[85%] rounded-xl p-4',
              m.fromShop
                ? 'ml-auto bg-quake/10'
                : 'border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5',
            )}
          >
            <p className="mb-1 text-xs text-ink/60 dark:text-paper/60">
              {m.authorName} · {formatDateTime(m.createdAt, timeZone, 'datetime', locale)}
            </p>
            <p className="text-sm whitespace-pre-line">{m.body}</p>
          </li>
        ))}
      </ol>
      <Panel>
        <ThreadActions threadId={thread.id} status={thread.status} />
      </Panel>
    </div>
  );
}
