import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { SeoForm, TrackingForm } from '../components/seo-forms';
import { SubNav } from '../components/sub-nav';
import { Panel } from '../components/ui';
import { listProducts, productById } from '../lib/data';
import { can } from '../lib/roles';
import { productChecks, storeChecks, storeMeta } from '../lib/seo';
import { EMPTY_TRACKING } from '../lib/tracking';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.seo') };
}

/**
 * Search engines: the shop's title and description with a preview, what the shop still lacks,
 * every product's score with what to improve, the sitemap, and (for the owner) tracking tags
 * and site verification codes.
 */
export default async function SeoPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale } = scope;
  const missing = needArea(store, roles, 'seo', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'seo');
  const summaries = await listProducts(db, store.id, { publishedOnly: false });
  // Full products for the checks (descriptions and photo counts); a shop has few enough.
  const products = (
    await Promise.all(summaries.slice(0, 500).map((p) => productById(db, store.id, p.id)))
  ).filter((p) => p !== null);
  const rows = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      ...productChecks({ ...p, photos: p.photoIds.length }, store.name),
    }))
    .sort((a, b) => a.score - b.score);
  const meta = storeMeta(store);
  const issues = storeChecks({
    published: store.published,
    description: store.seoDescription ?? store.about ?? '',
    hasLogo: store.logoVersion !== null,
    hasBanner: store.bannerVersion !== null,
    hasSeller: Boolean(store.seller.companyName && store.seller.email),
    publishedProducts: summaries.filter((p) => p.published).length,
  });
  const average = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
  const tone = (score: number) =>
    score >= 80
      ? 'text-green-700 dark:text-green-400'
      : score >= 50
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-red-700 dark:text-red-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="settings" current="/settings/seo" roles={roles} locale={locale} />

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('shop')}</h2>
        <SeoForm
          url={`${ctx.baseUrl}/s/${store.slug}`}
          value={{ seoTitle: store.seoTitle ?? '', seoDescription: store.seoDescription ?? '' }}
          fallback={meta}
        />
        {issues.length > 0 ? (
          <ul className="list-inside list-disc text-sm text-ink/70 dark:text-paper/70">
            {issues.map((i) => (
              <li key={i}>{t(`store.${i}`)}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-green-700 dark:text-green-400">{t('storeGood')}</p>
        )}
        <p className="text-xs text-ink/60 dark:text-paper/60">
          {t('sitemap')}{' '}
          <a href="/api/sitemap.xml" className="underline hover:text-quake">
            {`${ctx.baseUrl}/api/sitemap.xml`}
          </a>
        </p>
      </Panel>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">{t('products')}</h2>
          {rows.length > 0 ? (
            <p className={cn('text-sm font-semibold', tone(average))}>
              {t('average', { score: average })}
            </p>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('noProducts')}</p>
        ) : (
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-3 p-3">
                <span
                  className={cn('w-12 font-display text-xl font-bold tabular-nums', tone(r.score))}
                >
                  {r.score}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${r.id}`} className="font-medium hover:text-quake">
                    {r.name}
                  </Link>
                  {r.issues.length > 0 ? (
                    <p className="text-xs text-ink/60 dark:text-paper/60">
                      {r.issues.map((i) => t(`check.${i}`)).join(' · ')}
                    </p>
                  ) : (
                    <p className="text-xs text-green-700 dark:text-green-400">{t('allGood')}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {can(roles, 'tracking') ? (
        <Panel className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold">{t('tracking')}</h2>
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('trackingIntro')}</p>
          </div>
          <TrackingForm value={store.tracking ?? EMPTY_TRACKING} />
        </Panel>
      ) : (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('trackingOwnerOnly')}</p>
      )}
    </div>
  );
}
