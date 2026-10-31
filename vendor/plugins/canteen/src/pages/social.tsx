import type { PluginPageProps } from '@devquake/plugin-sdk';
import { orgScope } from '../components/guard';
import { OrgNav } from '../components/org-nav';
import { PrintHeader } from '../components/print-header';
import { NewApplicant, PlacesPanel, PlanVisit, VisitList, WaitingList } from '../components/social';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { listPeople } from '../lib/data';
import { socialOverview } from '../lib/social-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.social') };
}

/**
 * Social work: places per kind and their limits, the waiting list (admit when a place is free),
 * new applicants and visits. Organisers and staff ticked as the organisation's social workers.
 */
export default async function SocialPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'social.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const [overview, people] = await Promise.all([
    socialOverview(scope.db, scope.org.id, scope.user.id),
    scope.can('people.view')
      ? listPeople(scope.db, scope.org.id, scope.user.id)
      : Promise.resolve([]),
  ]);
  const canEdit = scope.can('social.edit');
  // Everyone a visit can be planned for: waiting applicants first, then the people served.
  const visitable = [
    ...overview.waiting.map((w) => ({ id: w.id, name: w.name })),
    ...people
      .filter((p) => p.status === 'active' || p.status === 'paused')
      .map((p) => ({ id: p.id, name: `${p.lastName} ${p.firstName}` })),
  ];
  return (
    <>
      <PrintHeader scope={scope} />
      <OrgNav
        orgId={scope.org.id}
        demo={scope.org.demo ? scope.staff.role : undefined}
        orgName={scope.org.name}
        current="social"
        can={scope.can}
        t={t}
      />
      <h1 className="mb-1 font-display text-2xl font-bold">{t('social.title')}</h1>
      <p className="mb-6 max-w-3xl text-sm text-ink/70 dark:text-paper/70">{t('social.intro')}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <PlacesPanel
          orgId={scope.org.id}
          places={overview.places}
          canEdit={scope.can('org.manage')}
        />
        <WaitingList
          orgId={scope.org.id}
          waiting={overview.waiting}
          places={overview.places}
          workers={overview.workers}
          myUserId={scope.user.id}
        />
        <Panel>
          <h2 className="mb-3 font-semibold">{t('social.visitsTitle')}</h2>
          <VisitList
            orgId={scope.org.id}
            visits={overview.visits}
            timeZone={scope.timeZone}
            showPerson
            myUserId={scope.user.id}
          />
          {canEdit ? (
            <div className="mt-4 border-t border-ink/10 pt-4 dark:border-paper/10">
              <PlanVisit
                orgId={scope.org.id}
                people={visitable}
                workers={overview.workers}
                myUserId={scope.user.id}
              />
            </div>
          ) : null}
        </Panel>
        {canEdit ? <NewApplicant orgId={scope.org.id} /> : null}
      </div>
    </>
  );
}
