import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { DesignEditor } from '../components/design-editor';
import { needArea, ownerScope } from '../components/guard';
import { SubNav } from '../components/sub-nav';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.design') };
}

/** The shop's look: logo, banner, colours, fonts, corners, cards, header and grid. */
export default async function DesignPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { store, roles, locale } = scope;
  const missing = needArea(store, roles, 'design', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'design');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="settings" current="/settings/design" roles={roles} locale={locale} />
      <DesignEditor
        storeName={store.name}
        tagline={store.tagline}
        shopPath={`/s/${store.slug}`}
        theme={store.theme}
        logo={store.logoVersion ? `/api/store/assets/logo?v=${store.logoVersion}` : null}
        banner={store.bannerVersion ? `/api/store/assets/banner?v=${store.bannerVersion}` : null}
      />
    </div>
  );
}
