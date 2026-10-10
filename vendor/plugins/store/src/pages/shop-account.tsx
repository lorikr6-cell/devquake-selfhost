import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { AccountActions, NewThreadForm, SignInForm } from '../components/account-client';
import { currentBuyer, moneyIn, shopScope } from '../components/guard';
import { StatusBadge } from '../components/order-view';
import { ShopFrame } from '../components/shop';
import { NewsletterSignup } from '../components/shop-client';
import { S } from '../components/shop-style';
import { buyerOrders, threadsOfBuyer } from '../lib/buyers-data';
import { shopMailConfigured } from '../lib/mailer';
import { orderReference } from '../lib/model';
import { subscriberByEmail } from '../lib/newsletter-data';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  return {
    title: translator(localeOf(ctx))('meta.account', { store }),
    robots: { index: false, follow: false },
  };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The buyer's account in this shop (ADR 0058): their orders (by their email address), their
 * conversations with the shop, the newsletter and their details. Without a session: the form
 * that emails a sign-in link.
 */
export default async function AccountPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, timeZone, db } = scope;
  const t = translator(locale, 'account');
  const buyer = await currentBuyer(db, store);

  if (!buyer) {
    return (
      <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
        <div className="space-y-4">
          <h1 className={cn('text-2xl font-bold', S.heading)}>{t('signInTitle')}</h1>
          <p className={cn('max-w-2xl', S.muted)}>{t('signInBody')}</p>
          {one(searchParams.expired) !== undefined ? (
            <p className="font-medium text-red-700 dark:text-red-400">{t('expired')}</p>
          ) : null}
          {shopMailConfigured() ? (
            <SignInForm slug={store.slug} />
          ) : (
            <p className={S.panel}>{t('mailOff')}</p>
          )}
        </div>
      </ShopFrame>
    );
  }

  const [orders, threads, subscriber] = await Promise.all([
    buyerOrders(db, store.id, buyer.email),
    threadsOfBuyer(db, buyer),
    subscriberByEmail(db, store.id, buyer.email),
  ]);
  const money = (cents: number, currency: string) => moneyIn(locale, currency)(cents);

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <div className="space-y-1">
        <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
        <p className={cn('text-sm', S.muted)}>{t('signedInAs', { email: buyer.email })}</p>
      </div>

      <section className="space-y-3">
        <h2 className={cn('text-xl font-semibold', S.heading)}>{t('orders')}</h2>
        {orders.length === 0 ? (
          <p className={cn('text-sm', S.muted)}>{t('noOrders')}</p>
        ) : (
          <ul className={cn('divide-y divide-[var(--shop-line)]', S.card)}>
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/s/${store.slug}/orders/${o.code}`}
                  className="flex flex-wrap items-center gap-3 p-3 hover:[background-color:var(--shop-surface)]"
                >
                  <span className="font-mono text-sm">{orderReference(o.id)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {o.names.slice(0, 3).join(', ')}
                    {o.names.length > 3 ? '…' : ''}
                  </span>
                  <StatusBadge status={o.status} locale={locale} />
                  <span className={cn('text-xs', S.muted)}>
                    {formatDateTime(o.createdAt, timeZone, 'date', locale)}
                  </span>
                  <span className="font-semibold">{money(o.totalCents, o.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className={cn('text-xl font-semibold', S.heading)}>{t('messages')}</h2>
        {threads.length === 0 ? (
          <p className={cn('text-sm', S.muted)}>{t('noMessages')}</p>
        ) : (
          <ul className={cn('divide-y divide-[var(--shop-line)]', S.card)}>
            {threads.map((th) => (
              <li key={th.id}>
                <Link
                  href={`/s/${store.slug}/account/messages/${th.id}`}
                  className="flex flex-wrap items-center gap-3 p-3 hover:[background-color:var(--shop-surface)]"
                >
                  {th.unread ? <span className={S.badge}>{t('new')}</span> : null}
                  <span className={cn('min-w-0 flex-1', th.unread && 'font-semibold')}>
                    <span className="block truncate">{th.subject}</span>
                    <span className={cn('block truncate text-xs', S.muted)}>{th.lastMessage}</span>
                  </span>
                  <span className={cn('text-xs', S.muted)}>
                    {formatDateTime(th.lastAt, timeZone, 'datetime', locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <NewThreadForm
          slug={store.slug}
          orders={orders.map((o) => ({
            id: o.id,
            label: `${orderReference(o.id)} · ${formatDateTime(o.createdAt, timeZone, 'date', locale)}`,
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className={cn('text-xl font-semibold', S.heading)}>{t('newsletter')}</h2>
        {subscriber?.status === 'confirmed' ? (
          <p className="text-sm">
            {t('subscribed')}{' '}
            <Link
              href={`/s/${store.slug}/newsletter?unsubscribe=${subscriber.token}`}
              className="underline"
            >
              {t('unsubscribe')}
            </Link>
          </p>
        ) : shopMailConfigured() ? (
          <div className={cn('text-sm', S.panel)}>
            <NewsletterSignup slug={store.slug} source="account" />
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className={cn('text-xl font-semibold', S.heading)}>{t('details')}</h2>
        <AccountActions slug={store.slug} name={buyer.name} />
        <p className={cn('text-xs', S.muted)}>{t('privacyNote')}</p>
      </section>
    </ShopFrame>
  );
}
