import type { PluginPageProps } from '@devquake/plugin-sdk';
import { notFound } from 'next/navigation';
import { LOCALE_TAGS, Link, buttonClass } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { PrintButton } from '../components/meals';
import { OrgNav } from '../components/org-nav';
import { DayPlanner } from '../components/routes';
import { localeOf, translator } from '../i18n';
import { addDays, isIsoDate } from '../lib/dates';
import { formatTime } from '../lib/meals';
import { orsKey } from '../lib/ors';
import { dayPlan } from '../lib/routes-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('orgNav.routes') };
}

/**
 * A day's routes: the planner on screen, and when printed one sheet per driver with the stops
 * in order, estimated times, names, addresses, phones, the note for the driver and the diet.
 */
export default async function RouteDayPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'routes.edit');
  if (!scope.ok) return scope.notice;
  if (!isIsoDate(params.day)) notFound();
  const day = params.day;
  const t = translator(scope.locale);
  const plan = await dayPlan(scope.db, scope.org.id, scope.user.id, day);
  const title = new Date(`${day}T12:00:00Z`).toLocaleDateString(LOCALE_TAGS[scope.locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const base = `/orgs/${scope.org.id}/routes`;
  const routes = plan.routes.filter((r) => r.stops.length > 0);

  return (
    <>
      <div className="print:hidden">
        <OrgNav
          orgId={scope.org.id}
          orgName={scope.org.name}
          current="routes"
          can={scope.can}
          t={t}
        />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold capitalize">{title}</h1>
          <div className="flex flex-wrap gap-2">
            <Link href={`${base}/${addDays(day, -1)}`} className={buttonClass('ghost')}>
              ← {t('kitchen.previous')}
            </Link>
            <Link href={base} className={buttonClass('ghost')}>
              {t('routes.week')}
            </Link>
            <Link href={`${base}/${addDays(day, 1)}`} className={buttonClass('ghost')}>
              {t('kitchen.next')} →
            </Link>
            {routes.length ? <PrintButton /> : null}
          </div>
        </div>
        <DayPlanner
          orgId={scope.org.id}
          plan={plan}
          canOptimise={Boolean(orsKey())}
          timeZone={scope.timeZone}
        />
      </div>

      {/* The printed route sheets: one page per driver. */}
      <div className="hidden print:block">
        {routes.map((r) => (
          <section key={r.driver.id} className="break-after-page text-black">
            <h1 className="text-xl font-bold">
              {r.driver.name} · <span className="capitalize">{title}</span>
            </h1>
            <p className="mb-3 text-sm">
              {scope.org.name} · {t('routes.start', { time: formatTime(r.driver.shiftFromMin) })}
              {r.driver.phone ? ` · ${r.driver.phone}` : ''}
            </p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-1 pr-2">#</th>
                  <th className="py-1 pr-2">{t('routes.eta')}</th>
                  <th className="py-1 pr-2">{t('routes.person')}</th>
                  <th className="py-1 pr-2">{t('fields.observation')}</th>
                  <th className="py-1">{t('routes.delivered')}</th>
                </tr>
              </thead>
              <tbody>
                {r.stops.map((s, i) => (
                  <tr key={s.id} className="border-b border-black/40 align-top">
                    <td className="py-2 pr-2">{i + 1}</td>
                    <td className="py-2 pr-2 font-mono">{formatTime(s.etaMin)}</td>
                    <td className="py-2 pr-2">
                      <strong>{s.name}</strong>
                      <br />
                      {s.address}
                      {s.phone ? (
                        <>
                          <br />
                          {s.phone}
                        </>
                      ) : null}
                      <br />
                      {t(`diets.${s.diet}`)}
                      {s.allergies ? ` · ⚠ ${s.allergies}` : ''}
                    </td>
                    <td className="py-2 pr-2 whitespace-pre-line">{s.observation}</td>
                    <td className="py-2">☐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </>
  );
}
