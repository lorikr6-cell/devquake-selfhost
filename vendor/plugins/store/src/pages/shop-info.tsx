import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { shopScope } from '../components/guard';
import { cn } from '@devquake/ui';
import { AnpcLinks, Paragraphs, ShopFrame } from '../components/shop';
import { S } from '../components/shop-style';
import { shopMailConfigured } from '../lib/mailer';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  if (!scope?.ok) return { robots: { index: false } };
  const t = translator(localeOf(ctx));
  return {
    title: t('meta.info', { store: scope.store.name }),
    robots: scope.preview ? { index: false } : { index: true, follow: true },
    alternates: { canonical: `${ctx.baseUrl}/s/${scope.store.slug}/info` },
  };
}

/**
 * Who sells, how to reach them, the terms of sale and returns, the 14-day right of withdrawal
 * and (in Romania) the ANPC links: what EU consumer law asks a shop to show.
 */
export default async function InfoPage({ ctx, params }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, db } = scope;
  const tp = translator(locale, 'privacy');
  const tr = store.tracking;
  const tools = [
    tr?.ga4 ? 'Google Analytics' : null,
    tr?.googleAds ? 'Google Ads' : null,
    tr?.gtm ? 'Google Tag Manager' : null,
    tr?.metaPixel ? 'Meta Pixel' : null,
    tr?.headSnippet || tr?.bodySnippet ? tp('otherTools') : null,
  ].filter((x): x is string => x !== null);
  const t = translator(locale, 'info');
  const s = store.seller;
  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn('space-y-1 text-sm', S.panel)}>
          <h2 className={cn('text-lg font-semibold', S.heading)}>{t('seller')}</h2>
          {s.companyName || s.address ? (
            <>
              {s.companyName ? <p className="font-medium">{s.companyName}</p> : null}
              {s.address ? <p>{s.address}</p> : null}
              {s.companyNumber ? <p>{t('companyNumber', { value: s.companyNumber })}</p> : null}
              {s.vatNumber ? <p>{t('vatNumber', { value: s.vatNumber })}</p> : null}
            </>
          ) : (
            <p className={S.muted}>{t('none')}</p>
          )}
        </div>
        <div className={cn('space-y-1 text-sm', S.panel)}>
          <h2 className={cn('text-lg font-semibold', S.heading)}>{t('contact')}</h2>
          {s.email || s.phone ? (
            <>
              {s.email ? (
                <p>
                  <a href={`mailto:${s.email}`} className="underline">
                    {s.email}
                  </a>
                </p>
              ) : null}
              {s.phone ? (
                <p>
                  <a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} className="underline">
                    {s.phone}
                  </a>
                </p>
              ) : null}
            </>
          ) : (
            <p className={S.muted}>{t('none')}</p>
          )}
        </div>
      </div>
      <section className="space-y-2">
        <h2 className={cn('text-xl font-semibold', S.heading)}>{t('terms')}</h2>
        {store.terms ? (
          <Paragraphs text={store.terms} className="text-sm" />
        ) : (
          <p className={cn('text-sm', S.muted)}>{t('none')}</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className={cn('text-xl font-semibold', S.heading)}>{t('returns')}</h2>
        <p className="text-sm">{t('withdrawal')}</p>
        {store.returnsPolicy ? <Paragraphs text={store.returnsPolicy} className="text-sm" /> : null}
      </section>
      <section id="privacy" className="scroll-mt-24 space-y-2 text-sm">
        <h2 className={cn('text-xl font-semibold', S.heading)}>{tp('title')}</h2>
        <p>{tp('orders', { seller: s.companyName ?? store.name })}</p>
        {shopMailConfigured() ? <p>{tp('accounts')}</p> : null}
        {shopMailConfigured() ? <p>{tp('newsletter')}</p> : null}
        {store.reviewsMode !== 'off' ? <p>{tp('reviews')}</p> : null}
        <p>{tp('browser')}</p>
        {tools.length > 0 ? <p>{tp('tracking', { tools: tools.join(', ') })}</p> : null}
        <p>{tp('rights', { email: s.email ?? '' })}</p>
      </section>
      {store.showAnpc ? (
        <section className="space-y-2">
          <h2 className={cn('text-xl font-semibold', S.heading)}>{t('anpc')}</h2>
          <AnpcLinks label={t('anpcSal')} labelSol={t('anpcSol')} />
        </section>
      ) : null}
    </ShopFrame>
  );
}
