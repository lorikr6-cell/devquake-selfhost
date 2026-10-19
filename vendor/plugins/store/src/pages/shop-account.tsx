import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import {
  AccountActions,
  ConnectButton,
  NewsletterCheckbox,
  DetailsForm,
  NewThreadForm,
  SignInForm,
} from '../components/account-client';
import {
  countryNamer,
  currentBuyer,
  devquakeAccountUrl,
  moneyIn,
  shopScope,
} from '../components/guard';
import { StatusBadge } from '../components/order-view';
import { ShopFrame, shopIcons } from '../components/shop';
import { CartStat } from '../components/shop-client';
import { S } from '../components/shop-style';
import { buyerOrders, threadsOfBuyer } from '../lib/buyers-data';
import { favoritesCountOf } from '../lib/favorites-data';
import { favoriteOwner } from '../lib/favorites';
import { shopMailConfigured } from '../lib/mailer';
import { COUNTRIES, orderReference } from '../lib/model';
import { subscriberByEmail } from '../lib/newsletter-data';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  return {
    title: translator(localeOf(ctx))('meta.account', { store }),
    robots: { index: false, follow: false },
    icons: scope?.ok ? shopIcons(scope.store, scope.preview) : undefined,
  };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The buyer's account in this shop (ADR 0058): their orders (by their email address), their
 * conversations with the shop, the newsletter and their details. Without a session: the form
 * that emails a sign-in link. A DevQuake member sees what comes from their DevQuake account
 * (name, email address; changed there) and counters of their favourites, purchases and cart.
 * Everyone signed in gets the newsletter with a checkbox, for the address already known.
 */
export default async function AccountPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, timeZone, db } = scope;
  const t = translator(locale, 'account');
  const buyer = await currentBuyer(db, store, ctx.user);

  if (!buyer) {
    return (
      <ShopFrame
        store={store}
        preview={preview}
        team={team}
        locale={locale}
        db={db}
        viewer={scope.viewer}
      >
        <div className="space-y-4">
          <h1 className={cn('text-2xl font-bold', S.heading)}>{t('signInTitle')}</h1>
          <p className={cn('max-w-2xl', S.muted)}>{t('signInBody')}</p>
          {one(searchParams.expired) !== undefined ? (
            <p className="font-medium text-red-700 dark:text-red-400">{t('expired')}</p>
          ) : null}
          {ctx.user && ctx.profile ? (
            // A DevQuake member: their account here from their DevQuake profile (ADR 0059).
            <div className={cn('max-w-md space-y-3', S.panel)}>
              <h2 className={cn('text-lg font-semibold', S.heading)}>{t('connectTitle')}</h2>
              <p className="text-sm">{t('connectBody', { name: ctx.user.displayName })}</p>
              <ConnectButton slug={store.slug} />
            </div>
          ) : null}
          {ctx.user && ctx.profile && shopMailConfigured() ? (
            <h2 className={cn('text-lg font-semibold', S.heading)}>{t('orEmail')}</h2>
          ) : null}
          {shopMailConfigured() ? (
            <SignInForm slug={store.slug} />
          ) : ctx.user && ctx.profile ? null : (
            <p className={S.panel}>{t('mailOff')}</p>
          )}
        </div>
      </ShopFrame>
    );
  }

  // Signed in on DevQuake (favourites are kept per member while signed in there).
  const member = ctx.user ? { user: ctx.user, accountUrl: devquakeAccountUrl(ctx) } : null;
  const [orders, threads, subscriber, favorites] = await Promise.all([
    buyerOrders(db, store.id, buyer.email),
    threadsOfBuyer(db, buyer),
    subscriberByEmail(db, store.id, buyer.email),
    member ? favoritesCountOf(db, store.id, favoriteOwner(member.user.id, null)!) : 0,
  ]);
  const tile = cn('block p-4 hover:[background-color:var(--shop-surface)]', S.card);
  const money = (cents: number, currency: string) => moneyIn(locale, currency)(cents);
  const countryName = countryNamer(locale);

  return (
    <ShopFrame
      store={store}
      preview={preview}
      team={team}
      locale={locale}
      db={db}
      viewer={scope.viewer}
    >
      <div className="space-y-1">
        <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
        {member ? null : (
          <p className={cn('text-sm', S.muted)}>{t('signedInAs', { email: buyer.email })}</p>
        )}
        {buyer.platformUserId !== null && buyer.platformUserId === ctx.user?.id ? (
          <p className={cn('text-sm', S.muted)}>{t('linked')}</p>
        ) : null}
      </div>

      {member ? (
        <>
          <section className={cn('max-w-xl space-y-2', S.panel)}>
            <h2 className={cn('text-lg font-semibold', S.heading)}>{t('devquakeTitle')}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className={S.muted}>{t('devquakeName')}</dt>
              <dd>{member.user.displayName}</dd>
              <dt className={S.muted}>{t('devquakeEmail')}</dt>
              <dd className="break-all">{buyer.email}</dd>
            </dl>
            <a href={member.accountUrl} className="inline-block text-sm underline">
              {t('manageOnDevQuake')}
            </a>
          </section>
          <section className="grid max-w-xl grid-cols-3 gap-3">
            <Link href={`/s/${store.slug}/favorites`} className={tile}>
              <span className={cn('block text-2xl font-bold', S.heading)}>{favorites}</span>
              <span className={cn('text-sm', S.muted)}>{t('statFavorites')}</span>
            </Link>
            <a href="#orders" className={tile}>
              <span className={cn('block text-2xl font-bold', S.heading)}>{orders.length}</span>
              <span className={cn('text-sm', S.muted)}>{t('statPurchases')}</span>
            </a>
            <CartStat slug={store.slug} label={t('statCart')} />
          </section>
        </>
      ) : null}

      <section id="orders" className="scroll-mt-24 space-y-3">
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
        {shopMailConfigured() || subscriber?.status === 'confirmed' ? (
          // Signed in, so the address is known: one checkbox, saved on click.
          <NewsletterCheckbox
            slug={store.slug}
            on={subscriber?.status === 'confirmed'}
            email={buyer.email}
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className={cn('text-xl font-semibold', S.heading)}>{t('details')}</h2>
        <AccountActions slug={store.slug} name={buyer.name} editName={!member} />
        <DetailsForm
          slug={store.slug}
          details={buyer.details}
          countries={COUNTRIES.map((code) => ({ code, name: countryName(code) })).sort((a, b) =>
            a.name.localeCompare(b.name, locale),
          )}
        />
        <p className={cn('text-xs', S.muted)}>{t(member ? 'memberPrivacyNote' : 'privacyNote')}</p>
      </section>
    </ShopFrame>
  );
}
