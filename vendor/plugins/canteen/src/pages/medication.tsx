import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, buttonClass } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { PrintButton } from '../components/meals';
import { MedicationRound } from '../components/medical';
import { OrgNav } from '../components/org-nav';
import { localeOf, translator } from '../i18n';
import { addDays, isIsoDate } from '../lib/dates';
import { medicationRound } from '../lib/medical-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.medication') };
}

/** The day's medication round: every dose due, recorded as given, refused or missed. */
export default async function MedicationPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'medical.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const asked = (await searchParams).day;
  const day = typeof asked === 'string' && isIsoDate(asked) ? asked : scope.today;
  const people = await medicationRound(scope.db, scope.org.id, scope.user.id, day);
  const title = new Date(`${day}T12:00:00Z`).toLocaleDateString(LOCALE_TAGS[scope.locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  const base = `/orgs/${scope.org.id}/medication`;
  return (
    <>
      <OrgNav
        orgId={scope.org.id}
        orgName={scope.org.name}
        current="medication"
        can={scope.can}
        t={t}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold capitalize">{title}</h1>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link href={`${base}?day=${addDays(day, -1)}`} className={buttonClass('ghost')}>
            ← {t('kitchen.previous')}
          </Link>
          <Link href={base} className={buttonClass('ghost')}>
            {t('kitchen.today')}
          </Link>
          <Link href={`${base}?day=${addDays(day, 1)}`} className={buttonClass('ghost')}>
            {t('kitchen.next')} →
          </Link>
          <PrintButton />
        </div>
      </div>
      <MedicationRound orgId={scope.org.id} day={day} people={people} />
    </>
  );
}
