import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { Dartboard } from '../components/dartboard';
import { pageScope } from '../components/guard';
import { CountBars, SkillBars, StatTile } from '../components/stats-charts';
import { Empty, PageTitle, Panel, SectionTitle } from '../components/ui';
import { MODES } from '../lib/engine/games';
import { statsGames } from '../lib/data/games';
import { analyze } from '../lib/stats';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.stats') };
}

/**
 * The player's own statistics (nobody else sees them): results per mode, skills with strong and
 * weak spots, where the darts land, the scores thrown most, and every opponent.
 */
export default async function Stats({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const ts = translator(locale, 'stats');
  const a = analyze(await statsGames(scope.db, scope.user.id), scope.user.id);
  const tz = ctx.timeZone ?? 'UTC';

  if (a.darts === 0) {
    return (
      <div className="space-y-6">
        <PageTitle title={ts('title')} intro={ts('intro')} />
        <Empty>{ts('empty')}</Empty>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title={ts('title')} intro={ts('intro')} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label={ts('average')}
          value={a.average === null ? '–' : a.average.toFixed(1)}
          hint={ts('averageHint')}
        />
        <StatTile label={ts('bestVisit')} value={String(a.bestVisit)} />
        <StatTile
          label={ts('highestCheckout')}
          value={a.highestCheckout ? String(a.highestCheckout) : '–'}
        />
        <StatTile
          label={ts('tons')}
          value={String(a.tons.t100 + a.tons.t140 + a.tons.t180)}
          hint={ts('tonsHint', { t100: a.tons.t100, t140: a.tons.t140, t180: a.tons.t180 })}
        />
      </div>

      <section>
        <SectionTitle>{ts('byMode')}</SectionTitle>
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink/60 dark:text-paper/60">
                <th scope="col" className="p-3 font-medium">
                  {ts('mode')}
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  {ts('played')}
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  {ts('won')}
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  {ts('lost')}
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  {ts('darts')}
                </th>
              </tr>
            </thead>
            <tbody>
              {MODES.map((m) => {
                const s = a.byMode[m];
                return (
                  <tr key={m} className="border-t border-ink/10 dark:border-paper/10">
                    <th scope="row" className="p-3 text-left font-medium">
                      {t(`modes.${m}.title`)}
                    </th>
                    <td className="p-3 text-right tabular-nums">{s.played}</td>
                    <td className="p-3 text-right tabular-nums">
                      {m === 'practice' ? '–' : s.won}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {m === 'practice' ? '–' : s.lost}
                    </td>
                    <td className="p-3 text-right tabular-nums">{s.darts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle>{ts('skills')}</SectionTitle>
          <SkillBars skills={a.skills} />
        </Panel>
        <Panel className="space-y-4">
          <SectionTitle>{ts('strongWeak')}</SectionTitle>
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              {ts('strong')}
            </p>
            <p className="text-sm">
              {a.strong.length ? a.strong.map((k) => t(`skills.${k}`)).join(', ') : ts('notYet')}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{ts('weak')}</p>
            <p className="text-sm">
              {a.weak.length ? a.weak.map((k) => t(`skills.${k}`)).join(', ') : ts('notYet')}
            </p>
          </div>
          {a.weakDoubles.length ? (
            <p className="text-sm">
              {ts('weakDoubles', {
                list: a.weakDoubles.map((n) => (n === 25 ? 'BULL' : `D${n}`)).join(', '),
              })}
            </p>
          ) : null}
          {a.weakNumbers.length ? (
            <p className="text-sm">{ts('weakNumbers', { list: a.weakNumbers.join(', ') })}</p>
          ) : null}
          <p className="text-sm text-ink/70 dark:text-paper/70">{ts('trainBody')}</p>
          <Link href="/practice" className={buttonClass('primary')}>
            {ts('train')}
          </Link>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle>{ts('heat')}</SectionTitle>
          <p className="mb-3 text-sm text-ink/70 dark:text-paper/70">{ts('heatHint')}</p>
          <div className="flex justify-center">
            <Dartboard heat={a.heat} label={ts('heatLabel')} className="max-w-sm" />
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer">{ts('segmentsTable')}</summary>
            <CountBars
              rows={a.commonSegments.map((s) => ({ label: s.key, count: s.count }))}
              label={ts('segmentsTable')}
            />
          </details>
        </Panel>
        <Panel>
          <SectionTitle>{ts('common')}</SectionTitle>
          <p className="mb-3 text-sm text-ink/70 dark:text-paper/70">{ts('commonHint')}</p>
          <CountBars
            rows={a.commonVisits.map((v) => ({ label: String(v.total), count: v.count }))}
            label={ts('common')}
          />
        </Panel>
      </section>

      <section>
        <SectionTitle>{ts('opponents')}</SectionTitle>
        {a.opponents.length === 0 ? (
          <Empty>{ts('noOpponents')}</Empty>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink/60 dark:text-paper/60">
                  <th scope="col" className="p-3 font-medium">
                    {ts('opponent')}
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    {ts('played')}
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    {ts('won')}
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    {ts('lost')}
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    {ts('where')}
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    {ts('last')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {a.opponents.map((o, i) => (
                  <tr key={i} className="border-t border-ink/10 dark:border-paper/10">
                    <th scope="row" className="p-3 text-left font-medium">
                      {o.name || t('score.formerPlayer')}
                    </th>
                    <td className="p-3 text-right tabular-nums">{o.played}</td>
                    <td className="p-3 text-right tabular-nums text-green-700 dark:text-green-400">
                      {o.won}
                    </td>
                    <td className="p-3 text-right tabular-nums text-red-700 dark:text-red-400">
                      {o.lost}
                    </td>
                    <td className="p-3 text-xs">
                      {MODES.filter((m) => o.byMode[m])
                        .map((m) => `${t(`modes.${m}.title`)} ${o.byMode[m]}`)
                        .join(' · ')}
                    </td>
                    <td className="p-3 text-xs">{formatDateTime(o.lastAt, tz, 'date', locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
