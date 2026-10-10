import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, formatDateTime, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { ReplyForm } from '../components/account-client';
import { currentBuyer, shopScope } from '../components/guard';
import { Paragraphs, ShopFrame } from '../components/shop';
import { S } from '../components/shop-style';
import { openThread } from '../lib/buyers-data';
import { orderReference } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  return {
    title: translator(localeOf(ctx))('meta.account', { store }),
    robots: { index: false, follow: false },
  };
}

/** A buyer's conversation with the shop. */
export default async function ThreadPage({ ctx, params }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, timeZone, db } = scope;
  const t = translator(locale, 'account');
  const buyer = await currentBuyer(db, store, ctx.user);
  if (!buyer) redirect(localizePath(`/s/${store.slug}/account`, locale));
  const threadId = Number(params.id);
  if (!Number.isSafeInteger(threadId) || threadId <= 0) notFound();
  const thread = await openThread(db, store.id, threadId, { buyerId: buyer.id });
  if (!thread) notFound();

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <div className="space-y-1">
        <Link href={`/s/${store.slug}/account`} className="text-sm underline">
          ← {t('back')}
        </Link>
        <h1 className={cn('text-2xl font-bold break-words', S.heading)}>{thread.subject}</h1>
        {thread.orderId ? (
          <p className={cn('text-sm', S.muted)}>
            {t('aboutOrderRef', { ref: orderReference(thread.orderId) })}
          </p>
        ) : null}
      </div>
      <ol className="space-y-3">
        {thread.messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              'max-w-[85%] p-4',
              S.radius,
              m.fromShop
                ? 'border [border-color:var(--shop-card-line)] [background-color:var(--shop-surface)]'
                : 'ml-auto [background-color:color-mix(in_srgb,var(--shop-accent)_12%,transparent)]',
            )}
          >
            <p className={cn('mb-1 text-xs', S.muted)}>
              {m.fromShop ? t('fromShop', { name: m.authorName, store: store.name }) : t('you')} ·{' '}
              {formatDateTime(m.createdAt, timeZone, 'datetime', locale)}
            </p>
            <Paragraphs text={m.body} className="text-sm" />
          </li>
        ))}
      </ol>
      <ReplyForm
        action={`/api/s/${store.slug}/account/messages/${thread.id}`}
        label={t('replyLabel')}
      />
    </ShopFrame>
  );
}
