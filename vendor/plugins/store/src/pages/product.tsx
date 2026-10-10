import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { PhotoManager } from '../components/photo-manager';
import { ProductForm } from '../components/product-form';
import { emptyProduct, type ProductValue } from '../components/product-value';
import { Panel } from '../components/ui';
import { ProductShare } from '../components/product-share';
import { listTypes, listVendors } from '../lib/catalog-data';
import { categoriesOf, productById } from '../lib/data';
import { productChecks } from '../lib/seo';
import { toLocalInput } from '../lib/dates';
import { centsToText } from '../lib/pricing';

const isNew = (params: Record<string, string>) => params.id === undefined;

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  if (isNew(params) || !ctx.user || !ctx.db) return { title: t('meta.newProduct') };
  const scope = await ownerScope(ctx);
  const product =
    scope.ok && scope.store ? await productById(scope.db, scope.store.id, Number(params.id)) : null;
  return { title: product ? t('meta.product', { name: product.name }) : t('meta.products') };
}

/** A new product (/products/new) or one to edit, with its photos. */
export default async function ProductPage({ ctx, params }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'products', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'productForm');
  const tPhotos = translator(locale, 'photos');
  const tMeta = translator(locale, 'meta');
  const [categories, types, vendors] = await Promise.all([
    categoriesOf(db, store.id, false),
    listTypes(db, store.id),
    listVendors(db, store.id),
  ]);
  const shopUrl = `${ctx.baseUrl}/s/${store.slug}`;
  let checks: ReturnType<typeof productChecks> | null = null;
  let published = false;

  let value: ProductValue = emptyProduct();
  let photoIds: number[] | null = null;
  let slug: string | null = null;
  if (!isNew(params)) {
    const id = Number(params.id);
    if (!Number.isSafeInteger(id) || id <= 0) notFound();
    const product = await productById(db, store.id, id);
    if (!product) notFound();
    slug = product.slug;
    photoIds = product.photoIds;
    published = product.published;
    checks = productChecks(
      { ...product, photos: product.photoIds.length, brand: product.brand },
      store.name,
    );
    value = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      summary: product.summary ?? '',
      description: product.description ?? '',
      seoTitle: product.seoTitle ?? '',
      seoDescription: product.seoDescription ?? '',
      gtin: product.gtin ?? '',
      category: product.category ?? '',
      typeId: product.typeId ? String(product.typeId) : '',
      vendorId: product.vendorId ? String(product.vendorId) : '',
      values: product.values,
      vatRate: product.vatRate === null ? '' : String(product.vatRate),
      published: product.published,
      options: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku ?? '',
        price: centsToText(v.priceCents),
        sale: v.saleCents === null ? '' : centsToText(v.saleCents),
        saleFrom: toLocalInput(v.saleFrom, timeZone),
        saleUntil: toLocalInput(v.saleUntil, timeZone),
        stock: v.stock === null ? '' : String(v.stock),
      })),
    };
  }

  return (
    <div className="space-y-6">
      <BackLink href="/products">{tMeta('products')}</BackLink>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold break-words">
          {value.id ? value.name : tMeta('newProduct')}
        </h1>
        {slug ? (
          <Link href={`/s/${store.slug}/p/${slug}`} className="text-sm underline hover:text-quake">
            {t('view')}
          </Link>
        ) : null}
      </div>
      <ProductForm
        key={value.id ?? 'new'}
        value={value}
        shopUrl={shopUrl}
        storeName={store.name}
        storeVatRate={store.vatRate}
        categories={categories}
        types={types.map((x) => ({ id: x.id, name: x.name, fields: x.fields }))}
        vendors={vendors.map((x) => ({ id: x.id, name: x.name }))}
        checks={checks}
      />
      {slug && published && store.published ? (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">{t('shareTitle')}</h2>
            <p className="text-sm text-ink/60 dark:text-paper/60">{t('shareHint')}</p>
          </div>
          <ProductShare
            url={`${shopUrl}/p/${slug}`}
            title={value.name}
            image={
              photoIds?.[0] !== undefined
                ? `${ctx.baseUrl}/api/s/${store.slug}/photos/${photoIds[0]}`
                : null
            }
            qrUrl={`/api/s/${store.slug}/p/${slug}/qr`}
            buttonClassName="inline-flex min-h-11 items-center gap-2 rounded-md border border-ink/20 px-4 py-2 text-sm font-medium hover:border-quake dark:border-paper/20"
          />
        </Panel>
      ) : null}
      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{tPhotos('title')}</h2>
        {photoIds && value.id ? (
          <PhotoManager productId={value.id} photoIds={photoIds} />
        ) : (
          <p className="text-sm text-ink/60 dark:text-paper/60">{tPhotos('saveFirst')}</p>
        )}
      </Panel>
    </div>
  );
}
