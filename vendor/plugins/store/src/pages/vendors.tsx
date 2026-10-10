import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { SubNav } from '../components/sub-nav';
import { VendorsEditor } from '../components/vendors-editor';
import { listVendors } from '../lib/catalog-data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.vendors') };
}

/** Who supplies or makes the products: brands, workshops, wholesalers, with their contacts. */
export default async function VendorsPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale } = scope;
  const missing = needArea(store, roles, 'products', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'vendors');
  const vendors = await listVendors(db, store.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="products" current="/vendors" roles={roles} locale={locale} />
      <VendorsEditor vendors={vendors} />
    </div>
  );
}
