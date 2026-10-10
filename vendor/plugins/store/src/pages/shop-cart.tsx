import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { shopScope } from '../components/guard';
import { cn } from '@devquake/ui';
import { ShopFrame } from '../components/shop';
import { liveRules } from '../lib/marketing-data';
import { S } from '../components/shop-style';
import { CartView } from '../components/shop-client';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  return { title: translator(localeOf(ctx))('meta.cart', { store }), robots: { index: false } };
}

/** The cart kept in the buyer's browser, checked against the shop's current prices and stock. */
export default async function CartPage({ ctx, params }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, db } = scope;
  const t = translator(locale, 'cart');
  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
      {/* In the owner's preview the photo route for buyers is closed: no pictures there. */}
      <CartView
        slug={store.slug}
        currency={store.currency}
        photoBase={preview ? null : `/api/s/${store.slug}/photos`}
        rules={await liveRules(db, store.id, new Date())}
      />
    </ShopFrame>
  );
}
