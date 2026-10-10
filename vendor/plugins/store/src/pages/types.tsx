import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { SubNav } from '../components/sub-nav';
import { TypesEditor } from '../components/types-editor';
import { TEMPLATE_IDS, TYPE_TEMPLATES } from '../i18n/type-templates';
import { listTypes } from '../lib/catalog-data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.types') };
}

/**
 * Product types and their fields (screen size, composition, author…): what each kind of
 * product says about itself, shown on its page and in the comparison. Ready-made types start
 * from templates in the owner's language.
 */
export default async function TypesPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale } = scope;
  const missing = needArea(store, roles, 'products', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'types');
  const types = await listTypes(db, store.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="products" current="/products/types" roles={roles} locale={locale} />
      <TypesEditor
        types={types}
        templates={TEMPLATE_IDS.map((id) => ({
          id,
          icon: TYPE_TEMPLATES[id].icon,
          name: TYPE_TEMPLATES[id].name[locale],
          fields: TYPE_TEMPLATES[id].fields.length,
        }))}
      />
    </div>
  );
}
