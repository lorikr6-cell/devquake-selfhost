import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { CompareTable, type CompareColumn, type CompareRow } from '../components/compare-table';
import { moneyIn, shopScope } from '../components/guard';
import { ShopFrame, photoUrl } from '../components/shop';
import { S } from '../components/shop-style';
import { fieldsOfTypes } from '../lib/catalog-data';
import { listProducts, productBySlug } from '../lib/data';
import { formatValue } from '../lib/fields';
import { COMPARE_MAX } from '../components/compare';

export async function generateMetadata({ ctx, params }: PluginPageProps): Promise<Metadata> {
  const scope = await shopScope(ctx, params.slug).catch(() => null);
  const store = scope?.ok ? scope.store.name : '';
  // A buyer's own selection: never indexed.
  return {
    title: translator(localeOf(ctx))('meta.compare', { store }),
    robots: { index: false, follow: true },
  };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Products side by side (?p=slug,slug,…): price, rating, brand and their fields. */
export default async function ComparePage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await shopScope(ctx, params.slug);
  if (!scope.ok) return scope.notice;
  const { store, preview, team, locale, db } = scope;
  const t = translator(locale, 'compare');
  const tShop = translator(locale, 'shop');
  const tag = LOCALE_TAGS[locale];
  const money = moneyIn(locale, store.currency);
  const slugs = [
    ...new Set(
      (one(searchParams.p) ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^[a-z0-9-]{1,80}$/.test(s)),
    ),
  ].slice(0, COMPARE_MAX);
  const summaries = await listProducts(db, store.id, { publishedOnly: !team, slugs });
  const products = (
    await Promise.all(summaries.map((s) => productBySlug(db, store.id, s.slug)))
  ).filter((p) => p !== null);
  // In the order the buyer picked them.
  products.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));
  const fieldsByType = await fieldsOfTypes(
    db,
    store.id,
    products.map((p) => p.typeId).filter((x): x is number => x !== null),
  );
  const words = { yes: tShop('yes'), no: tShop('no') };

  const columns: CompareColumn[] = products.map((p) => {
    const s = summaries.find((x) => x.id === p.id)!;
    return {
      slug: p.slug,
      name: p.name,
      href: `/s/${store.slug}/p/${p.slug}`,
      image: s.photoId !== null ? photoUrl(store, preview, p.id, s.photoId, true) : null,
      price: s.priceVaries ? tShop('from', { price: money(s.fromCents) }) : money(s.fromCents),
      was: s.onSale ? money(s.regularCents) : null,
    };
  });

  // Rows: the basics, then every field of the products' types (by label, so two types with a
  // "Colour" field share one row).
  const rows: CompareRow[] = [
    {
      label: t('rating'),
      values: products.map((p) =>
        p.rating.count
          ? t('ratingValue', {
              rating: p.rating.average.toLocaleString(tag),
              count: p.rating.count,
            })
          : '',
      ),
    },
    { label: t('brand'), values: products.map((p) => p.brand ?? '') },
    { label: t('category'), values: products.map((p) => p.category ?? '') },
    {
      label: t('options'),
      values: products.map((p) =>
        p.variants
          .map((v) => v.name)
          .filter(Boolean)
          .join(', '),
      ),
    },
    {
      label: t('availability'),
      values: summaries.length
        ? products.map((p) => {
            const s = summaries.find((x) => x.id === p.id)!;
            return s.stock === 0 ? tShop('soldOut') : t('inStock');
          })
        : [],
    },
  ];
  const seen = new Map<string, CompareRow>();
  for (const [i, p] of products.entries()) {
    for (const f of p.typeId ? (fieldsByType.get(p.typeId) ?? []) : []) {
      if (!f.inCompare) continue;
      const key = `${f.label.toLowerCase()}|${f.unit ?? ''}`;
      const row = seen.get(key) ?? { label: f.label, values: products.map(() => '') };
      seen.set(key, row);
      const v = p.values[f.id];
      row.values[i] = v ? formatValue(f, v, words, tag) : '';
    }
  }
  rows.push(...seen.values());
  rows.push({ label: t('summary'), values: products.map((p) => p.summary ?? '') });

  return (
    <ShopFrame store={store} preview={preview} team={team} locale={locale} db={db}>
      <div className="space-y-1">
        <h1 className={cn('text-2xl font-bold', S.heading)}>{t('title')}</h1>
        <p className={cn('text-sm', S.muted)}>{t('intro', { max: COMPARE_MAX })}</p>
      </div>
      <CompareTable
        slug={store.slug}
        columns={columns}
        rows={rows.filter((r) => r.values.some(Boolean))}
      />
    </ShopFrame>
  );
}
