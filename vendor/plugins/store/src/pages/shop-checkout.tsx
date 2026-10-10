import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { CheckoutForm } from '../components/checkout-form';
import { countryNamer, currentBuyer, shopScope } from '../components/guard';
import { cn } from '@devquake/ui';
import { ShopFrame } from '../components/shop';
import { liveRules } from '../lib/marketing-data';
import { S } from '../components/shop-style';
import { shopMailConfigured } from '../lib/mailer';
import { methodsOf, zonesOf } from '../lib/data';
import { COUNTRIES } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  return { title: translator(localeOf(ctx))('meta.checkout', { store }), robots: { index: false } };
}

/** The buyer's details, where to ship, how to pay, and the order. */
export default async function CheckoutPage({ ctx, params }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, db } = scope;
  const t = translator(locale, 'checkout');
  // The signed-in buyer (or connected DevQuake member) finds their details filled in (ADR 0059).
  const me = await currentBuyer(db, store, ctx.user);
  const zones = await zonesOf(db, store.id);
  const name = countryNamer(locale);
  // The countries the shop ships to: named ones, or every listed one with a catch-all zone.
  const codes = zones.some((z) => z.countries.includes('*'))
    ? [...new Set([...zones.flatMap((z) => z.countries.filter((c) => c !== '*')), ...COUNTRIES])]
    : [...new Set(zones.flatMap((z) => z.countries))];
  const countries = codes
    .map((code) => ({ code, name: name(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  // The shop's own country first: the first zone's first country.
  const home = zones[0]?.countries.find((c) => c !== '*');
  if (home) countries.sort((a, b) => (a.code === home ? -1 : b.code === home ? 1 : 0));

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
      <CheckoutForm
        slug={store.slug}
        currency={store.currency}
        zones={zones}
        methods={methodsOf(store)}
        codFeeCents={store.cod.feeCents}
        storeVatRate={store.vatRate}
        countries={countries}
        newsletter={shopMailConfigured()}
        rules={await liveRules(db, store.id, new Date())}
        prefill={
          me
            ? {
                name: me.name,
                email: me.email,
                ...me.details,
              }
            : null
        }
      />
    </ShopFrame>
  );
}
