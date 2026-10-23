import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { PrintButton } from '../components/meals';
import { PrintHeader } from '../components/print-header';
import { localeOf, translator } from '../i18n';
import { MAX_SPAN_DAYS, plansBetween } from '../lib/areas-data';
import { addDays, isIsoDate } from '../lib/dates';
import { formatTime } from '../lib/meals';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('areas.printTitle') };
}

/**
 * Route sheets of a span (a day, a week, a month): one page per driver and day, with every
 * stop's details, for one driver or all of them. Planners only.
 */
export default async function RoutesPrintPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'routes.edit');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const q = await searchParams;
  const from = typeof q.from === 'string' && isIsoDate(q.from) ? q.from : scope.today;
  const asked = typeof q.to === 'string' && isIsoDate(q.to) ? q.to : from;
  const to =
    asked < from
      ? from
      : asked > addDays(from, MAX_SPAN_DAYS - 1)
        ? addDays(from, MAX_SPAN_DAYS - 1)
        : asked;
  const driver = typeof q.driver === 'string' ? Number(q.driver) : null;
  const plans = await plansBetween(scope.db, scope.org.id, scope.user.id, from, to);
  const tag = LOCALE_TAGS[scope.locale];
  const dayTitle = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(tag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  const sheets = plans.flatMap((p) =>
    p.routes
      .filter((r) => r.stops.length && (driver === null || r.driver.id === driver))
      .map((r) => ({ day: p.day, route: r })),
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link
            href={`/orgs/${scope.org.id}/routes/areas`}
            className="text-sm underline hover:text-quake"
          >
            ← {t('areas.title')}
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold">{t('areas.printTitle')}</h1>
          <p className="text-sm text-ink/70 dark:text-paper/70">
            {t('areas.sheets', { count: sheets.length })}
          </p>
        </div>
        <PrintButton />
      </div>
      {sheets.length === 0 ? <p className="text-sm">{t('areas.noSheets')}</p> : null}
      {sheets.map(({ day, route: r }) => (
        <section
          key={`${day}-${r.driver.id}`}
          className="mb-10 break-after-page text-black print:mb-0 dark:text-paper print:dark:text-black"
        >
          <PrintHeader scope={scope} />
          <h2 className="text-xl font-bold">
            {r.driver.name} · <span className="capitalize">{dayTitle(day)}</span>
          </h2>
          <p className="mb-3 text-sm">
            {t('routes.start', { time: formatTime(r.driver.shiftFromMin) })}
            {r.driver.phone ? ` · ${r.driver.phone}` : ''} ·{' '}
            {t('areas.stops', { count: r.stops.length })}
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-current text-left">
                <th className="py-1 pr-2">#</th>
                <th className="py-1 pr-2">{t('routes.eta')}</th>
                <th className="py-1 pr-2">{t('routes.person')}</th>
                <th className="py-1 pr-2">{t('fields.observation')}</th>
                <th className="py-1">{t('routes.delivered')}</th>
              </tr>
            </thead>
            <tbody>
              {r.stops.map((s, i) => (
                <tr key={s.id} className="border-b border-current/40 align-top">
                  <td className="py-2 pr-2">{i + 1}</td>
                  <td className="py-2 pr-2 font-mono">
                    {formatTime(s.etaMin)}
                    {s.window.fromMin !== null && s.window.toMin !== null ? (
                      <span className="block text-xs">
                        {formatTime(s.window.fromMin)}–{formatTime(s.window.toMin)}
                      </span>
                    ) : null}
                  </td>
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
                  <td className="py-2">{s.deliveredAt ? '✓' : '☐'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
