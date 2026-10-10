import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { NewsletterAction } from '../components/account-client';
import { shopScope } from '../components/guard';
import { ShopFrame } from '../components/shop';
import { NewsletterSignup } from '../components/shop-client';
import { S } from '../components/shop-style';
import { shopMailConfigured } from '../lib/mailer';
import { SUBSCRIBER_TOKEN, subscriberByToken } from '../lib/newsletter-data';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  return {
    title: translator(localeOf(ctx))('meta.newsletter', { store }),
    robots: { index: false, follow: true },
    referrer: 'no-referrer',
  };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The shop's newsletter: sign up, confirm an address (?confirm=token) or leave (?unsubscribe=
 * token). Confirming and leaving need a press of a button, so mail programs that open links to
 * check them change nothing.
 */
export default async function NewsletterPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, db } = scope;
  const t = translator(locale, 'newsletterPage');
  const confirm = one(searchParams.confirm) ?? '';
  const leave = one(searchParams.unsubscribe) ?? '';
  const token = confirm || leave;
  const subscriber =
    token && SUBSCRIBER_TOKEN.test(token) ? await subscriberByToken(db, store.id, token) : null;

  let body;
  if (token && !subscriber) body = <p>{t('linkGone')}</p>;
  else if (confirm && subscriber) {
    body =
      subscriber.status === 'confirmed' ? (
        <p className="font-medium">{t('confirmed')}</p>
      ) : (
        <>
          <p>{t('confirmBody', { email: subscriber.email })}</p>
          <NewsletterAction slug={store.slug} token={confirm} kind="confirm" />
        </>
      );
  } else if (leave && subscriber) {
    body =
      subscriber.status === 'unsubscribed' ? (
        <p className="font-medium">{t('left')}</p>
      ) : (
        <>
          <p>{t('leaveBody', { email: subscriber.email })}</p>
          <NewsletterAction slug={store.slug} token={leave} kind="unsubscribe" />
        </>
      );
  } else if (shopMailConfigured()) {
    body = <NewsletterSignup slug={store.slug} source="shop" />;
  } else {
    body = <p>{t('off')}</p>;
  }

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <div className="max-w-xl space-y-4">
        <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
        <div className={cn('space-y-3', S.panel)}>{body}</div>
      </div>
    </ShopFrame>
  );
}
