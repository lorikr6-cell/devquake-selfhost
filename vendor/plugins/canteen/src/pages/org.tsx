import type { PluginPageProps } from '@devquake/plugin-sdk';
import { PrintHeader } from '../components/print-header';
import { redirect } from 'next/navigation';
import { Link, buttonClass, localizePath } from '@devquake/ui';
import { OrgForm } from '../components/forms';
import { DeleteOrg } from '../components/delete-org';
import { OrgBanner } from '../components/org-banner';
import { OrgPageSettings } from '../components/org-settings';
import { OrgTransfer } from '../components/org-transfer';
import { orgScope } from '../components/guard';
import { OrgNav } from '../components/org-nav';
import { Avatar, PeopleList } from '../components/people-list';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { listPeople, orgById, staffOf, type Person } from '../lib/data';
import { orgPage } from '../lib/org-page';
import { ageOn, daysToBirthday } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const orgId = Number(params.id);
  // The name only for its staff: nobody else learns that the organisation exists.
  const staff =
    ctx.db && ctx.user && orgId > 0
      ? await staffOf(ctx.db, orgId, ctx.user.id).catch(() => null)
      : null;
  const org = staff && ctx.db ? await orgById(ctx.db, orgId).catch(() => null) : null;
  return { title: org ? t('meta.org', { name: org.name }) : t('meta.home') };
}

/** An organisation: its people, the week's birthdays, and (organisers) its name. */
export default async function OrgPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'org.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  if (!scope.can('people.view')) {
    // The kitchen works from its sheet; drivers get their routes in a next version.
    if (scope.can('kitchen.view')) {
      redirect(localizePath(`/orgs/${scope.org.id}/kitchen`, scope.locale));
    }
    if (scope.can('route.own')) {
      redirect(localizePath(`/orgs/${scope.org.id}/my-route`, scope.locale));
    }
    return (
      <>
        <OrgNav
          orgId={scope.org.id}
          demo={scope.org.demo ? scope.staff.role : undefined}
          orgName={scope.org.name}
          current="people"
          can={scope.can}
          t={t}
        />
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('org.driverSoon')}</p>
      </>
    );
  }
  const [people, page] = await Promise.all([
    listPeople(scope.db, scope.org.id, scope.user.id),
    orgPage(scope.db, scope.org.id, scope.user.id),
  ]);
  const birthdays = people
    .filter((p) => p.status !== 'ended')
    .flatMap((person) => {
      const days = daysToBirthday(person.birthDate, scope.today);
      return days !== null && days <= 7 ? [{ person, days }] : [];
    })
    .sort((a, b) => a.days - b.days);

  /** The age they turn on their birthday (today, or within the week). */
  const turning = (p: Person, days: number) =>
    ageOn(p.birthDate!, scope.today) + (days > 0 ? 1 : 0);

  return (
    <>
      <PrintHeader scope={scope} />
      <OrgNav
        orgId={scope.org.id}
        demo={scope.org.demo ? scope.staff.role : undefined}
        orgName={`${scope.org.name} · ${t(`roles.${scope.staff.role}`)}`}
        current="people"
        can={scope.can}
        t={t}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <OrgBanner page={page} logoUrl={`/api/orgs/${scope.org.id}/logo`} />
        </div>
        {scope.can('people.edit') ? (
          <Link href={`/orgs/${scope.org.id}/people/new`} className={buttonClass('primary')}>
            {t('org.addPerson')}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t('org.people')}</h2>
          <PeopleList orgId={scope.org.id} people={people} />
        </section>
        <aside className="space-y-6">
          <Panel>
            <h2 className="mb-3 font-semibold">{t('org.birthdays')}</h2>
            {birthdays.length === 0 ? (
              <p className="text-sm text-ink/70 dark:text-paper/70">{t('org.noBirthdays')}</p>
            ) : (
              <ul className="space-y-3">
                {birthdays.map(({ person, days }) => {
                  const age = t('person.age', { age: turning(person, days) });
                  return (
                    <li key={person.id}>
                      <Link
                        href={`/orgs/${scope.org.id}/people/${person.id}`}
                        className="flex items-center gap-3 hover:text-quake"
                      >
                        <Avatar orgId={scope.org.id} person={person} size={32} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {person.lastName} {person.firstName}
                          </span>
                          <span className="block text-xs text-ink/60 dark:text-paper/60">
                            {days === 0
                              ? `🎂 ${t('org.birthdayToday', { age })}`
                              : t('org.birthdayIn', { count: days, age })}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          {scope.can('org.manage') ? (
            <Panel>
              <h2 className="mb-3 font-semibold">{t('org.settings')}</h2>
              <OrgForm org={scope.org} />
              <div className="mt-4 border-t border-ink/10 pt-4 dark:border-paper/10">
                <OrgPageSettings page={page} />
              </div>
              <div className="mt-4 border-t border-ink/10 pt-4 dark:border-paper/10">
                <h3 className="mb-2 text-sm font-semibold">{t('transfer.title')}</h3>
                <OrgTransfer orgId={scope.org.id} />
              </div>
              <div className="mt-4 border-t border-ink/10 pt-4 dark:border-paper/10">
                <DeleteOrg org={scope.org} />
              </div>
              <Link
                href={`/orgs/${scope.org.id}/staff`}
                className="mt-4 inline-block text-sm underline hover:text-quake"
              >
                {t('staff.link')}
              </Link>
            </Panel>
          ) : null}
        </aside>
      </div>
    </>
  );
}
