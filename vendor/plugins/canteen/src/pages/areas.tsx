import type { PluginPageProps } from '@devquake/plugin-sdk';
import { AreasEditor } from '../components/areas';
import { orgScope } from '../components/guard';
import { OrgNav } from '../components/org-nav';
import { PrintHeader } from '../components/print-header';
import { localeOf, translator } from '../i18n';
import { areaPlan } from '../lib/areas-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('areas.title') };
}

/**
 * Driver areas: which driver delivers to whom, proposed from the addresses so that drivers do
 * not overlap, changed by hand, then the routes of a day, a week or a month built from them and
 * printed. Planners only.
 */
export default async function AreasPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'routes.edit');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const plan = await areaPlan(scope.db, scope.org.id, scope.user.id);
  return (
    <>
      <PrintHeader scope={scope} />
      <OrgNav
        orgId={scope.org.id}
        demo={scope.org.demo ? scope.staff.role : undefined}
        orgName={scope.org.name}
        current="routes"
        can={scope.can}
        t={t}
      />
      <h1 className="font-display text-2xl font-bold">{t('areas.title')}</h1>
      <p className="mt-1 mb-6 max-w-3xl text-sm text-ink/70 dark:text-paper/70">
        {t('areas.intro')}
      </p>
      <AreasEditor orgId={scope.org.id} plan={plan} today={scope.today} />
    </>
  );
}
