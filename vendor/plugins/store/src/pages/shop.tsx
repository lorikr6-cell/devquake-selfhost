import type { Metadata } from 'next';
import type { PluginContext, PluginPageProps } from '@devquake/plugin-sdk';
import { Link, cn, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { AnnouncementView } from '../components/announcement-view';
import { shopScope } from '../components/guard';
import { Paragraphs, ProductCard, ShopFrame, assetUrl } from '../components/shop';
import { SortSelect } from '../components/shop-browse';
import { S } from '../components/shop-style';
import {
  PRODUCT_SORTS,
  categoriesOf,
  listProducts,
  type ProductSort,
  type Store,
} from '../lib/data';
import { liveAnnouncements } from '../lib/marketing-data';
import { storeMeta } from '../lib/seo';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Search engines index open shops (ADR 0057); closed ones and previews are not indexed. */
export function shopMetadata(store: Store, baseUrl: string, preview: boolean): Metadata {
  const url = `${baseUrl}/s/${store.slug}`;
  const meta = storeMeta(store);
  const banner =
    !preview && store.bannerVersion
      ? `${baseUrl}/api/s/${store.slug}/assets/banner?v=${store.bannerVersion}`
      : null;
  const t = store.tracking;
  return {
    title: meta.title,
    description: meta.description,
    robots: preview ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: meta.title,
      description: meta.description,
      url,
      siteName: store.name,
      ...(banner ? { images: [{ url: banner, alt: store.name }] } : {}),
    },
    twitter: { card: banner ? 'summary_large_image' : 'summary' },
    // Search engines' ownership checks (Search Console, Bing Webmaster Tools).
    verification:
      t?.googleVerification || t?.bingVerification
        ? {
            ...(t.googleVerification ? { google: t.googleVerification } : {}),
            ...(t.bingVerification ? { other: { 'msvalidate.01': t.bingVerification } } : {}),
          }
        : undefined,
  };
}

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  if (!scope?.ok) return { robots: { index: false } };
  return shopMetadata(scope.store, ctx.baseUrl, scope.preview);
}

const GRID: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
};

/** The shop's front page: banner, announcements, and its products by category or campaign. */
export async function StoreFront({
  ctx,
  store,
  preview,
  team,
  locale,
  category,
  campaignId,
  sort,
}: {
  ctx: PluginContext;
  store: Store;
  preview: boolean;
  team: boolean;
  locale: Locale;
  category: string | null;
  campaignId: number | null;
  sort: ProductSort;
}) {
  const t = translator(locale, 'shop');
  const db = ctx.db!;
  const [products, categories, announcements] = await Promise.all([
    listProducts(db, store.id, { publishedOnly: true, category, campaignId, sort }),
    categoriesOf(db, store.id, true),
    liveAnnouncements(db, store.id, new Date()),
  ]);
  const base = `/s/${store.slug}`;
  const banner = assetUrl(store, preview, 'banner');
  const campaign = campaignId ? (products[0]?.campaign ?? null) : null;
  const filtered = Boolean(category || campaignId);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.seoDescription ?? store.tagline ?? undefined,
    url: `${ctx.baseUrl}${base}`,
    logo: store.logoVersion
      ? `${ctx.baseUrl}/api/s/${store.slug}/assets/logo?v=${store.logoVersion}`
      : undefined,
    image: store.bannerVersion
      ? `${ctx.baseUrl}/api/s/${store.slug}/assets/banner?v=${store.bannerVersion}`
      : undefined,
    email: store.seller.email ?? undefined,
    telephone: store.seller.phone ?? undefined,
    address: store.seller.address ?? undefined,
    currenciesAccepted: store.currency,
  };

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <script
        type="application/ld+json"
        // JSON.stringify escapes everything but "<", which could end the script early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {banner && !filtered ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner} alt="" className={cn('aspect-[3/1] w-full object-cover', S.radius)} />
      ) : null}
      {!filtered
        ? announcements
            .filter((a) => a.placement === 'banner')
            .map((a) => (
              <AnnouncementView key={a.id} store={store} announcement={a} locale={locale} />
            ))
        : null}
      {store.about && !filtered ? (
        <Paragraphs text={store.about} className={cn('max-w-3xl', S.muted)} />
      ) : null}
      {campaign ? (
        <div className="space-y-1">
          <h1 className={cn('text-2xl font-bold', S.heading)}>
            {t('campaignTitle', { name: campaign.name, percent: campaign.percentOff })}
          </h1>
          <Link href={base} className="text-sm underline">
            {t('allProducts')}
          </Link>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {categories.length > 1 ? (
          <nav aria-label={t('categories')} className="flex flex-wrap gap-2">
            <Link href={base} className={!category ? S.chipActive : S.chip}>
              {t('all')}
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`${base}?category=${encodeURIComponent(c)}`}
                className={c === category ? S.chipActive : S.chip}
              >
                {c}
              </Link>
            ))}
          </nav>
        ) : (
          <span />
        )}
        {products.length > 1 ? <SortSelect value={sort} /> : null}
      </div>
      {products.length === 0 ? (
        <p className={cn('text-sm', S.muted)}>{t('empty')}</p>
      ) : (
        <ul className={cn('grid gap-3', GRID[store.theme?.columns ?? 4])}>
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard store={store} product={p} preview={preview} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </ShopFrame>
  );
}

/** The front page's filters from the address (?category=, ?campaign=, ?sort=). */
export function frontFilters(searchParams: PluginPageProps['searchParams']) {
  const sort = one(searchParams.sort);
  const campaign = Number(one(searchParams.campaign));
  return {
    category: one(searchParams.category)?.slice(0, 60) || null,
    campaignId: Number.isSafeInteger(campaign) && campaign > 0 ? campaign : null,
    sort: (PRODUCT_SORTS as readonly string[]).includes(sort ?? '')
      ? (sort as ProductSort)
      : 'position',
  };
}

export default async function ShopPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  return (
    <StoreFront
      ctx={ctx}
      store={scope.store}
      preview={scope.preview}
      team={scope.team}
      locale={scope.locale}
      {...frontFilters(searchParams)}
    />
  );
}
