import type { PluginPageProps } from '@devquake/plugin-sdk';
import { buttonClass, formatDateTime } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { PrintButton } from '../components/meals';
import { OrgNav } from '../components/org-nav';
import { PrintHeader } from '../components/print-header';
import { Panel, fieldClass } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { AREAS } from '../lib/activity';
import { MAX_REPORT_DAYS, activityReport, reportArea, reportGroup } from '../lib/activity-data';
import { listStaff } from '../lib/data';
import { addDays, isIsoDate } from '../lib/dates';
import { ROLES } from '../lib/roles';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('reports.title') };
}

/**
 * Activity reports (organisers): what the staff changed in a span, for one person or a group
 * (a role, the social workers, everyone), per area, and the newest lines. Printable.
 */
export default async function ReportsPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'org.manage');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const q = await searchParams;
  const to = typeof q.to === 'string' && isIsoDate(q.to) ? q.to : scope.today;
  const asked = typeof q.from === 'string' && isIsoDate(q.from) ? q.from : addDays(to, -29);
  const from =
    asked > to ? to : asked < addDays(to, -MAX_REPORT_DAYS) ? addDays(to, -MAX_REPORT_DAYS) : asked;
  const group = reportGroup(q.group);
  const area = reportArea(q.area);
  const [staff, report] = await Promise.all([
    listStaff(scope.db, scope.org.id, scope.user.id),
    activityReport(scope.db, scope.org.id, scope.user.id, {
      from,
      to,
      group,
      area,
      timeZone: scope.timeZone,
    }),
  ]);
  const shownAreas = area === 'all' ? AREAS : [area];
  const groupLabel = group.startsWith('user:')
    ? (staff.find((m) => `user:${m.userId}` === group)?.name ?? t('reports.former'))
    : group === 'all'
      ? t('reports.everyone')
      : group === 'social'
        ? t('reports.socialWorkers')
        : t(`reports.roleGroup.${group}`);
  const total = report.members.reduce((n, m) => n + m.total, 0);
  const cell = 'px-3 py-2';

  return (
    <>
      <PrintHeader scope={scope} />
      <OrgNav
        orgId={scope.org.id}
        demo={scope.org.demo ? scope.staff.role : undefined}
        orgName={scope.org.name}
        current="reports"
        can={scope.can}
        t={t}
      />
      <h1 className="mb-1 font-display text-2xl font-bold">{t('reports.title')}</h1>
      <p className="mb-4 max-w-3xl text-sm text-ink/70 dark:text-paper/70 print:hidden">
        {t('reports.intro')}
      </p>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 p-4 print:hidden dark:border-paper/10"
      >
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t('reports.from')}</span>
          <input type="date" name="from" defaultValue={from} className={fieldClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t('reports.to')}</span>
          <input type="date" name="to" defaultValue={to} className={fieldClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t('reports.who')}</span>
          <select name="group" defaultValue={group} className={fieldClass}>
            <option value="all">{t('reports.everyone')}</option>
            <optgroup label={t('reports.groups')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`reports.roleGroup.${r}`)}
                </option>
              ))}
              <option value="social">{t('reports.socialWorkers')}</option>
            </optgroup>
            <optgroup label={t('reports.people')}>
              {staff.map((m) => (
                <option key={m.id} value={`user:${m.userId}`}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t('reports.area')}</span>
          <select name="area" defaultValue={area} className={fieldClass}>
            <option value="all">{t('reports.allAreas')}</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {t(`reports.areas.${a}`)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonClass('primary')}>
          {t('reports.show')}
        </button>
        <PrintButton />
      </form>

      <p className="mb-4 text-sm font-medium">
        {t('reports.summary', {
          who: groupLabel,
          from: formatDateTime(from, 'UTC', 'date', scope.locale),
          to: formatDateTime(to, 'UTC', 'date', scope.locale),
        })}
        {area === 'all' ? '' : ` · ${t(`reports.areas.${area}`)}`}
      </p>

      {report.members.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('reports.empty')}</p>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-xl border border-ink/10 dark:border-paper/10">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-ink/5 text-xs text-ink/70 dark:bg-paper/5 dark:text-paper/70">
                <tr>
                  <th className={`${cell} font-medium`}>{t('reports.person')}</th>
                  {shownAreas.map((a) => (
                    <th key={a} className={`${cell} text-right font-medium`}>
                      {t(`reports.areas.${a}`)}
                    </th>
                  ))}
                  <th className={`${cell} text-right font-medium`}>{t('reports.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
                {report.members.map((m) => (
                  <tr key={m.userId ?? 'former'}>
                    <td className={cell}>
                      <span className="font-medium">{m.name ?? t('reports.former')}</span>
                      {m.roles.length || m.socialWorker ? (
                        <span className="block text-xs text-ink/60 dark:text-paper/60">
                          {[
                            ...m.roles.map((r) => t(`roles.${r}`)),
                            ...(m.socialWorker ? [t('staff.socialWorker')] : []),
                          ].join(' · ')}
                        </span>
                      ) : null}
                    </td>
                    {shownAreas.map((a) => (
                      <td key={a} className={`${cell} text-right tabular-nums`}>
                        {m.counts[a] ?? '·'}
                      </td>
                    ))}
                    <td className={`${cell} text-right font-semibold tabular-nums`}>{m.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-ink/15 font-semibold dark:border-paper/15">
                <tr>
                  <td className={cell}>{t('reports.total')}</td>
                  {shownAreas.map((a) => (
                    <td key={a} className={`${cell} text-right tabular-nums`}>
                      {report.members.reduce((n, m) => n + (m.counts[a] ?? 0), 0) || '·'}
                    </td>
                  ))}
                  <td className={`${cell} text-right tabular-nums`}>{total}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <Panel>
            <h2 className="mb-1 font-semibold">{t('reports.lines')}</h2>
            {report.truncated ? (
              <p className="mb-2 text-xs text-ink/60 dark:text-paper/60">
                {t('reports.truncated', { count: report.entries.length })}
              </p>
            ) : null}
            <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
              {report.entries.map((e, i) => (
                <li key={i} className="flex flex-wrap gap-x-3 py-1.5">
                  <span className="w-36 shrink-0 text-xs text-ink/60 tabular-nums dark:text-paper/60">
                    {formatDateTime(e.at, scope.timeZone, 'datetime', scope.locale)}
                  </span>
                  <span className="font-medium">{e.name ?? t('reports.former')}</span>
                  <span>
                    {t(`reports.actions.${e.action.replace('.', '_')}`)}
                    {e.person ? ` · ${e.person}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </>
  );
}
