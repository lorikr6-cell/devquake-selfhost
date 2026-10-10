import type { PluginPageProps } from '@devquake/plugin-sdk';
import { formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { LanguagesEditor } from '../components/languages-editor';
import { SubNav } from '../components/sub-nav';
import { listLanguages } from '../lib/languages-data';
import { countLabels, exportLabels } from '../lib/store-i18n';
import { appMessages } from '../i18n';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.languages') };
}

/**
 * The shop's own languages: copy the labels buyers see, translate them anywhere, paste them
 * back as a new language or as changes to a built-in one, and choose what buyers see first.
 */
export default async function LanguagesPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'settings', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'languages');
  const languages = await listLanguages(db, store.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="settings" current="/settings/languages" roles={roles} locale={locale} />
      <LanguagesEditor
        total={countLabels(JSON.parse(exportLabels(appMessages('en'))))}
        defaultLanguage={store.defaultLanguage}
        languages={languages.map((l) => ({
          ...l,
          updated: formatDateTime(l.updatedAt, timeZone, 'datetime', locale),
        }))}
      />
    </div>
  );
}
