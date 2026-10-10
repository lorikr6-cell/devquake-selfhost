import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, ZoomableImage, cn, formatDateTime, LOCALE_TAGS } from '@devquake/ui';
import { translator } from '../i18n';
import { shopScope } from '../components/guard';
import { Paragraphs, ShopFrame, Stars, photoUrl } from '../components/shop';
import { AddToCart, CompareToggle } from '../components/shop-client';
import { ProductShare } from '../components/product-share';
import { ReviewForm } from '../components/review-form';
import { S } from '../components/shop-style';
import { fieldsOfTypes } from '../lib/catalog-data';
import { productBySlug } from '../lib/data';
import { formatValue } from '../lib/fields';
import { priceNow } from '../lib/pricing';
import { productReviews } from '../lib/reviews-data';
import { productMeta } from '../lib/seo';
import { recordView } from '../lib/stats-data';

async function load({ ctx, params }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return { scope, product: null };
  const product = await productBySlug(scope.db, scope.store.id, params.product ?? '');
  // Drafts are seen by the team only.
  if (!product || (!product.published && !scope.team)) notFound();
  return { scope, product };
}

export async function generateMetadata(props: PluginPageProps): Promise<Metadata> {
  const { scope, product } = await load(props).catch(() => ({ scope: null, product: null }));
  if (!scope?.ok || !product) return { robots: { index: false } };
  const { store } = scope;
  const url = `${props.ctx.baseUrl}/s/${store.slug}/p/${product.slug}`;
  const meta = productMeta(product, store.name);
  const hidden = scope.preview || !product.published;
  const image =
    product.photoIds[0] !== undefined && !hidden
      ? `${props.ctx.baseUrl}${photoUrl(store, false, product.id, product.photoIds[0])}`
      : null;
  return {
    title: meta.title,
    description: meta.description,
    robots: hidden ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: product.seoTitle ?? product.name,
      description: meta.description,
      url,
      siteName: store.name,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
  };
}

/**
 * A product with its photos, options, prices, campaign and sale, its specifications, reviews,
 * sharing (links and a QR code), and schema.org Product data.
 */
export default async function ProductPage(props: PluginPageProps) {
  const { scope, product } = await load(props);
  if (!scope.ok) return scope.notice;
  if (!product) notFound();
  const { store, preview, team, locale, timeZone, db } = scope;
  const t = translator(locale, 'shop');
  const tReviews = translator(locale, 'reviewsShop');
  const tag = LOCALE_TAGS[locale];
  const now = new Date();
  const percent = product.campaign?.percentOff ?? 0;
  if (!team && product.published) await recordView(db, store.id, product.id).catch(() => undefined);
  const options = product.variants.map((v) => {
    const p = priceNow(v, now, percent);
    return {
      id: v.id,
      name: v.name,
      cents: p.cents,
      regularCents: p.regularCents,
      onSale: p.onSale,
      stock: v.stock,
      saleUntil: p.onSale ? (p.campaign ? (product.campaign?.endsAt ?? null) : v.saleUntil) : null,
    };
  });
  const saleEnds = options.find((o) => o.saleUntil)?.saleUntil ?? null;
  const vatRate = product.vatRate ?? store.vatRate;
  const base = `${props.ctx.baseUrl}/s/${store.slug}`;
  const url = `${base}/p/${product.slug}`;
  const images = product.photoIds.map(
    (id) => `${props.ctx.baseUrl}${photoUrl(store, false, product.id, id)}`,
  );
  const fields = product.typeId
    ? ((await fieldsOfTypes(db, store.id, [product.typeId])).get(product.typeId) ?? [])
    : [];
  const specs = fields
    .map((f) => ({ field: f, value: product.values[f.id] ?? '' }))
    .filter((x) => x.value !== '');
  const words = { yes: t('yes'), no: t('no') };
  const { reviews, summary } =
    store.reviewsMode === 'off'
      ? { reviews: [], summary: null }
      : await productReviews(db, store.id, product.id, 30);

  // schema.org Product with one Offer per option, the brand, codes and ratings.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.seoDescription ?? product.summary ?? product.description ?? undefined,
      image: images.length ? images : undefined,
      category: product.category ?? undefined,
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      gtin: product.gtin ?? undefined,
      sku: product.variants.length === 1 ? (product.variants[0]!.sku ?? undefined) : undefined,
      url,
      additionalProperty: specs.length
        ? specs.map((s) => ({
            '@type': 'PropertyValue',
            name: s.field.label,
            value: formatValue(s.field, s.value, words, tag),
          }))
        : undefined,
      aggregateRating:
        summary && summary.count > 0
          ? { '@type': 'AggregateRating', ratingValue: summary.average, reviewCount: summary.count }
          : undefined,
      review: reviews.length
        ? reviews.slice(0, 5).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author },
            datePublished: r.createdAt.slice(0, 10),
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            name: r.title ?? undefined,
            reviewBody: r.body ?? undefined,
          }))
        : undefined,
      offers: product.variants.map((v, i) => ({
        '@type': 'Offer',
        name: v.name || undefined,
        sku: v.sku ?? undefined,
        price: (options[i]!.cents / 100).toFixed(2),
        priceCurrency: store.currency,
        availability:
          v.stock !== null && v.stock <= 0
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
        ...(options[i]!.saleUntil ? { priceValidUntil: options[i]!.saleUntil!.slice(0, 10) } : {}),
        url,
        seller: { '@type': 'Organization', name: store.seller.companyName ?? store.name },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: store.name, item: base },
        ...(product.category
          ? [
              {
                '@type': 'ListItem',
                position: 2,
                name: product.category,
                item: `${base}?category=${encodeURIComponent(product.category)}`,
              },
            ]
          : []),
        {
          '@type': 'ListItem',
          position: product.category ? 3 : 2,
          name: product.name,
          item: url,
        },
      ],
    },
  ];

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav aria-label={t('breadcrumbs')} className={cn('flex flex-wrap gap-1 text-sm', S.muted)}>
        <Link href={`/s/${store.slug}`} className="underline">
          {store.name}
        </Link>
        {product.category ? (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/s/${store.slug}?category=${encodeURIComponent(product.category)}`}
              className="underline"
            >
              {product.category}
            </Link>
          </>
        ) : null}
      </nav>
      <article className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {product.photoIds.length > 0 ? (
            <>
              <ZoomableImage
                src={photoUrl(store, preview, product.id, product.photoIds[0]!)}
                alt={product.name}
                className="block w-full"
                imgClassName={cn('aspect-square w-full object-cover', S.radius)}
              />
              {product.photoIds.length > 1 ? (
                <ul className="grid grid-cols-4 gap-2">
                  {product.photoIds.slice(1).map((id, i) => (
                    <li key={id}>
                      <ZoomableImage
                        src={photoUrl(store, preview, product.id, id)}
                        alt={t('photo', { n: i + 2, name: product.name })}
                        className="block w-full"
                        imgClassName={cn('aspect-square w-full object-cover', S.radius)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <div
              aria-hidden
              className={cn(
                'grid aspect-square place-items-center text-6xl opacity-40 [background-color:var(--shop-surface)]',
                S.radius,
              )}
            >
              🛍️
            </div>
          )}
        </div>
        <div className="space-y-5">
          <div className="space-y-1">
            {product.brand ? (
              <p className={cn('text-sm tracking-wide uppercase', S.muted)}>{product.brand}</p>
            ) : null}
            <h1 className={cn('text-3xl font-bold break-words', S.heading)}>{product.name}</h1>
            {summary && summary.count > 0 ? (
              <a href="#reviews" className="inline-flex items-center gap-2 text-sm">
                <Stars
                  value={summary.average}
                  label={t('ratingLabel', { rating: summary.average })}
                />
                <span className="underline">{tReviews('count', { count: summary.count })}</span>
              </a>
            ) : null}
            {product.summary ? <p className={cn('pt-1', S.muted)}>{product.summary}</p> : null}
          </div>
          {product.campaign ? (
            <p className={cn('inline-flex flex-wrap items-center gap-2 text-sm font-medium')}>
              <span className={S.badge}>−{product.campaign.percentOff}%</span>
              <span>{product.campaign.name}</span>
            </p>
          ) : null}
          <AddToCart slug={store.slug} currency={store.currency} options={options} />
          <p className={cn('text-xs', S.muted)}>
            {t('vatRate', { rate: vatRate.toLocaleString(tag) })}
            {saleEnds
              ? ` · ${t('saleEnds', { date: formatDateTime(saleEnds, timeZone, 'datetime', locale) })}`
              : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <CompareToggle slug={store.slug} product={product.slug} withLabel />
            {product.published && !preview ? (
              <ProductShare
                url={url}
                title={product.name}
                image={images[0] ?? null}
                qrUrl={`/api/s/${store.slug}/p/${product.slug}/qr`}
              />
            ) : null}
          </div>
          {product.description ? <Paragraphs text={product.description} /> : null}
        </div>
      </article>

      {specs.length > 0 || product.gtin ? (
        <section className="space-y-3">
          <h2 className={cn('text-xl font-semibold', S.heading)}>{t('specs')}</h2>
          <dl className={cn('divide-y divide-[var(--shop-line)] text-sm', S.card)}>
            {specs.map(({ field, value }) => (
              <div key={field.id} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[14rem_1fr]">
                <dt className={S.muted}>{field.label}</dt>
                <dd className="whitespace-pre-line">
                  {field.kind === 'color' ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-4 rounded-full border border-black/10"
                        style={{ backgroundColor: value }}
                      />
                      {value}
                    </span>
                  ) : field.kind === 'url' ? (
                    <a href={value} rel="noopener nofollow" target="_blank" className="underline">
                      {value}
                    </a>
                  ) : (
                    formatValue(field, value, words, tag)
                  )}
                </dd>
              </div>
            ))}
            {product.gtin ? (
              <div className="grid gap-1 px-4 py-2.5 sm:grid-cols-[14rem_1fr]">
                <dt className={S.muted}>{t('gtin')}</dt>
                <dd className="font-mono">{product.gtin}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {summary ? (
        <section id="reviews" className="scroll-mt-24 space-y-4">
          <h2 className={cn('text-xl font-semibold', S.heading)}>{tReviews('title')}</h2>
          {summary.count > 0 ? (
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-4xl font-bold">{summary.average.toLocaleString(tag)}</p>
                <Stars
                  value={summary.average}
                  label={t('ratingLabel', { rating: summary.average })}
                />
                <p className={cn('text-sm', S.muted)}>
                  {tReviews('count', { count: summary.count })}
                </p>
              </div>
              <ul className="min-w-48 flex-1 space-y-1 text-sm">
                {[5, 4, 3, 2, 1].map((n) => {
                  const k = summary.stars[n - 1]!;
                  return (
                    <li key={n} className="flex items-center gap-2">
                      <span className="w-6 text-right">{n}★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full [background-color:var(--shop-line)]">
                        <span
                          className="block h-full [background-color:var(--shop-accent)]"
                          style={{ width: `${(k / summary.count) * 100}%` }}
                        />
                      </span>
                      <span className={cn('w-8 text-right', S.muted)}>{k}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className={cn('text-sm', S.muted)}>{tReviews('none')}</p>
          )}
          {reviews.length > 0 ? (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className={S.panel}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={r.rating} label={t('ratingLabel', { rating: r.rating })} />
                    {r.title ? <p className="font-semibold">{r.title}</p> : null}
                  </div>
                  <p className={cn('mt-1 text-xs', S.muted)}>
                    {r.author} · {formatDateTime(r.createdAt, timeZone, 'date', locale)}
                    {r.verified ? ` · ✓ ${tReviews('verified')}` : ''}
                  </p>
                  {r.body ? <Paragraphs text={r.body} className="mt-2 text-sm" /> : null}
                  {r.reply ? (
                    <div
                      className={cn(
                        'mt-3 border-l-2 pl-3 text-sm [border-color:var(--shop-accent)]',
                      )}
                    >
                      <p className="font-semibold">{tReviews('reply', { store: store.name })}</p>
                      <Paragraphs text={r.reply} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {!preview ? (
            <ReviewForm action={`/api/s/${store.slug}/p/${product.slug}/reviews`} moderated />
          ) : null}
        </section>
      ) : null}
    </ShopFrame>
  );
}
