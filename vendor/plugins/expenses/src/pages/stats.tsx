import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { BarList, MonthBars } from '../components/charts';
import { BalanceText, GroupShell } from '../components/group-shell';
import { groupScope, moneyIn, nameOf } from '../components/guard';
import { Panel } from '../components/ui';
import { groupById, ledgerOf, statsOf } from '../lib/data';
import { categoryIcon } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const group =
    ctx.db && ctx.user ? await groupById(ctx.db, Number(params.id)).catch(() => null) : null;
  return { title: group ? t('meta.stats', { name: group.name }) : t('meta.home') };
}

/** Where the money went: by category, by person (paid and share) and by month. */
export default async function StatsPage({ ctx, params }: PluginPageProps) {
  const scope = await groupScope(ctx, params);
  if (!scope.ok) return scope.notice;
  const { db, group, me, members, locale } = scope;
  const t = translator(locale);
  const tGroup = translator(locale, 'group');
  const tStats = translator(locale, 'stats');
  const money = moneyIn(locale, group.currency);
  const [stats, ledger] = await Promise.all([statsOf(db, group.id), ledgerOf(db, group.id)]);

  return (
    <GroupShell
      group={group}
      tab="stats"
      members={members.filter((m) => m.active).length}
      balance={
        <BalanceText cents={ledger.balance.get(me.memberId) ?? 0} money={money} t={tGroup} />
      }
      t={tGroup}
      tKinds={translator(locale, 'kinds')}
    >
      {stats.byCategory.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{tStats('empty')}</p>
      ) : (
        <div className="space-y-6">
          <p className="text-sm">
            {tStats('total')}{' '}
            <span className="font-display text-2xl font-bold tabular-nums">
              {money(stats.total)}
            </span>
          </p>
          <Panel className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{tStats('byCategory')}</h2>
            <BarList
              label={tStats('byCategory')}
              currency={group.currency}
              items={stats.byCategory.map((c) => ({
                key: c.category,
                label: t(`categories.${c.category}`),
                icon: categoryIcon(c.category),
                amount: c.amount,
              }))}
            />
          </Panel>
          <Panel className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{tStats('byMonth')}</h2>
            <MonthBars
              months={stats.byMonth}
              currency={group.currency}
              title={tStats('byMonth')}
              // The placeholder stays for the chart to fill in (a client component).
              maxLabel={tStats('max', { value: '{value}' })}
            />
          </Panel>
          <Panel flush>
            <h2 className="px-5 pt-4 font-display text-lg font-semibold">{tStats('byMember')}</h2>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink/60 dark:text-paper/60">
                  <th className="px-5 py-2 font-medium">{tStats('member')}</th>
                  <th className="px-5 py-2 text-right font-medium">{tStats('paid')}</th>
                  <th className="px-5 py-2 text-right font-medium">{tStats('share')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
                {stats.byMember.map((m) => (
                  <tr key={m.memberId}>
                    <td className="px-5 py-2">{nameOf(members, m.memberId, t)}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{money(m.paid)}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{money(m.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 py-3 text-xs text-ink/60 dark:text-paper/60">
              {tStats('memberHint')}
            </p>
          </Panel>
        </div>
      )}
    </GroupShell>
  );
}
