import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, buttonClass, cn } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { OrgNav } from '../components/org-nav';
import { Drivers } from '../components/routes';
import { localeOf, translator } from '../i18n';
import { addDays, isIsoDate, mondayOf } from '../lib/dates';
import {
  dayPlan,
  driverAccounts,
  kitchenAddress,
  listDrivers,
  weekRoutes,
} from '../lib/routes-data';
import { licencesOf } from '../lib/licence-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.routes') };
}

/** The week's routes at a glance (stops per driver, late routes, people not placed) and the drivers. */
export default async function RoutesPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'routes.edit');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const asked = (await searchParams).week;
  const monday = mondayOf(typeof asked === 'string' && isIsoDate(asked) ? asked : scope.today);
  const [week, drivers, today, accounts] = await Promise.all([
    weekRoutes(scope.db, scope.org.id, scope.user.id, monday),
    listDrivers(scope.db, scope.org.id, scope.user.id),
    dayPlan(scope.db, scope.org.id, scope.user.id, scope.today),
    driverAccounts(scope.db, scope.org.id, scope.user.id),
  ]);
  const [kitchen, licences] = await Promise.all([
    kitchenAddress(scope.db, scope.org.id, scope.user.id),
    licencesOf(scope.db, scope.org.id, scope.user.id),
  ]);
  const tag = LOCALE_TAGS[scope.locale];
  const base = `/orgs/${scope.org.id}/routes`;
  const label = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(tag, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });

  return (
    <>
      <OrgNav
        orgId={scope.org.id}
        orgName={scope.org.name}
        current="routes"
        can={scope.can}
        t={t}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t('routes.weekTitle')}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`${base}?week=${addDays(monday, -7)}`} className={buttonClass('ghost')}>
            ← {t('meals.previous')}
          </Link>
          <Link href={base} className={buttonClass('ghost')}>
            {t('meals.thisWeek')}
          </Link>
          <Link href={`${base}?week=${addDays(monday, 7)}`} className={buttonClass('ghost')}>
            {t('meals.next')} →
          </Link>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {week.map((d) => (
          <li key={d.day}>
            <Link
              href={`${base}/${d.day}`}
              className={cn(
                'block h-full rounded-xl border bg-white/70 p-3 hover:border-quake dark:bg-paper/5',
                d.day === scope.today ? 'border-quake' : 'border-ink/10 dark:border-paper/10',
              )}
            >
              <span className="block font-semibold capitalize">{label(d.day)}</span>
              {d.routes.length === 0 && d.unassigned === 0 ? (
                <span className="mt-1 block text-xs text-ink/60 dark:text-paper/60">
                  {t('routes.noDeliveries')}
                </span>
              ) : null}
              <ul className="mt-2 space-y-0.5 text-xs">
                {d.routes.map((r) => (
                  <li
                    key={r.driverId}
                    className={cn(!r.ok && 'font-semibold text-red-700 dark:text-red-400')}
                  >
                    {r.name}: {t('routes.stops', { count: r.stops })}
                    {r.ok ? '' : ` · ${t('routes.lateShort')}`}
                  </li>
                ))}
              </ul>
              {d.unassigned ? (
                <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
                  {t('routes.unassigned', { count: d.unassigned })}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Drivers
          orgId={scope.org.id}
          drivers={drivers}
          minutesPerStop={today.minutesPerStop}
          accounts={accounts}
          kitchen={kitchen}
          licences={Object.fromEntries([...licences].map(([id, l]) => [id, l.expiresOn]))}
          today={scope.today}
        />
      </div>
    </>
  );
}
