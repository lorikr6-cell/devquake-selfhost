import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { appIcons } from '../components/app-icons';
import { needArea, ownerScope } from '../components/guard';
import { PackagesEditor } from '../components/packages-editor';
import { SubNav } from '../components/sub-nav';
import { Notice } from '../components/ui';
import { listPackages } from '../lib/claims-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return {
    title: translator(localeOf(ctx), 'claims.packages')('title'),
    icons: await appIcons(ctx),
    robots: { index: false },
  };
}

/**
 * NPS point packages (ADR 0079): what DevQuake gives as prizes and rewards through claims.
 * DevQuake staff only, in their shop; reached from the prizes in /admin-cp, not the menu.
 */
export default async function PackagesPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, user } = scope;
  const missing = needArea(store, roles, 'marketing', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'claims.packages');
  const tg = translator(locale, 'guard');
  if (!user.isAdmin)
    return (
      <Notice title={tg('forbiddenTitle')}>
        <p>{tg('forbiddenBody')}</p>
      </Notice>
    );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="marketing" current="/packages" roles={roles} locale={locale} isAdmin />
      <PackagesEditor initial={await listPackages(db, store.id)} />
    </div>
  );
}
