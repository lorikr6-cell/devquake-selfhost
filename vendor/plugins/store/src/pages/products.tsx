import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { moneyIn, needArea, ownerScope } from '../components/guard';
import { ProductList } from '../components/product-list';
import { SubNav } from '../components/sub-nav';
import { listTypes, listVendors } from '../lib/catalog-data';
import { listProducts } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.products') };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const idOf = (v: string | undefined) => {
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

/**
 * The owner's products: search, filters (type, vendor, drafts), price now, stock and rating;
 * open, close or delete several at once, or copy one.
 */
export default async function Products({ ctx, searchParams }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale } = scope;
  const missing = needArea(store, roles, 'products', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'products');
  const search = one(searchParams.q)?.trim().slice(0, 80) || null;
  const status = one(searchParams.status);
  const filter = {
    search,
    typeId: idOf(one(searchParams.type)),
    vendorId: idOf(one(searchParams.vendor)),
    status: status === 'draft' || status === 'published' ? status : null,
  } as const;
  const [products, types, vendors] = await Promise.all([
    listProducts(db, store.id, { publishedOnly: false, ...filter }),
    listTypes(db, store.id),
    listVendors(db, store.id),
  ]);
  const money = moneyIn(locale, store.currency);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <Link href="/products/new" className={buttonClass('primary')}>
          {t('new')}
        </Link>
      </div>
      <SubNav group="products" current="/products" roles={roles} locale={locale} />
      <ProductList
        filter={{
          q: search ?? '',
          type: filter.typeId ? String(filter.typeId) : '',
          vendor: filter.vendorId ? String(filter.vendorId) : '',
          status: filter.status ?? '',
        }}
        types={types.map((x) => ({ id: x.id, name: x.name }))}
        vendors={vendors.map((x) => ({ id: x.id, name: x.name }))}
        items={products.map((p) => ({
          id: p.id,
          name: p.name,
          photoId: p.photoId,
          published: p.published,
          meta: [
            p.category,
            p.brand,
            p.typeId ? (types.find((x) => x.id === p.typeId)?.name ?? null) : null,
          ]
            .filter(Boolean)
            .join(' · '),
          stock: p.stock,
          price: p.priceVaries ? t('from', { price: money(p.fromCents) }) : money(p.fromCents),
          onSale: p.onSale,
          rating: p.rating.count ? `${p.rating.average}★ (${p.rating.count})` : null,
        }))}
      />
    </div>
  );
}
