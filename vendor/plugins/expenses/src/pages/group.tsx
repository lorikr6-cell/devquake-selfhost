import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { AddExpense } from '../components/expense-actions';
import { BalanceText, GroupShell } from '../components/group-shell';
import { groupScope, moneyIn, nameOf } from '../components/guard';
import { expensesOf, groupById, ledgerOf } from '../lib/data';
import { formatDayLong } from '../lib/dates';
import { categoryIcon } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const group =
    ctx.db && ctx.user ? await groupById(ctx.db, Number(params.id)).catch(() => null) : null;
  return { title: group ? t('meta.group', { name: group.name }) : t('meta.home') };
}

/** A group's expenses, newest day first, with "Add an expense" on top. */
export default async function GroupPage({ ctx, params, searchParams }: PluginPageProps) {
  const scope = await groupScope(ctx, params);
  if (!scope.ok) return scope.notice;
  const { db, group, me, members, locale } = scope;
  const t = translator(locale);
  const tGroup = translator(locale, 'group');
  const tExp = translator(locale, 'expenses');
  const money = moneyIn(locale, group.currency);
  const [expenses, ledger] = await Promise.all([expensesOf(db, group.id), ledgerOf(db, group.id)]);
  const active = members.filter((m) => m.active);

  // Grouped by day, newest first (the list comes sorted).
  const days = new Map<string, typeof expenses>();
  for (const e of expenses) days.set(e.spentOn, [...(days.get(e.spentOn) ?? []), e]);

  return (
    <GroupShell
      group={group}
      tab="expenses"
      members={active.length}
      balance={
        <BalanceText cents={ledger.balance.get(me.memberId) ?? 0} money={money} t={tGroup} />
      }
      t={tGroup}
      tKinds={translator(locale, 'kinds')}
    >
      <AddExpense
        groupId={group.id}
        currency={group.currency}
        members={active.map((m) => ({ id: m.id, name: m.name }))}
        me={me.memberId}
        today={scope.today}
        startOpen={searchParams.add === '1' || expenses.length === 0}
      />
      {expenses.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{tExp('empty')}</p>
      ) : (
        <div className="space-y-6">
          {[...days].map(([day, list]) => (
            <section key={day} className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wider text-ink/60 uppercase dark:text-paper/60">
                {formatDayLong(day, LOCALE_TAGS[locale])}
              </h2>
              <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/70 dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
                {list.map((e) => {
                  const mine = e.shares.find((s) => s.memberId === me.memberId)?.amount ?? null;
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/groups/${group.id}/expenses/${e.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-quake/5"
                      >
                        <span aria-hidden className="text-2xl">
                          {categoryIcon(e.category)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{e.title}</span>
                          <span className="block text-xs text-ink/60 dark:text-paper/60">
                            {tExp('paidBy', {
                              name: nameOf(members, e.paidBy, t),
                              amount: money(e.amount),
                            })}
                            {e.comments > 0
                              ? ` · 💬 ${tExp('comments', { count: e.comments })}`
                              : ''}
                          </span>
                        </span>
                        <span className="text-right text-sm tabular-nums">
                          {mine === null ? (
                            <span className="text-ink/50 dark:text-paper/50">
                              {tExp('notInvolved')}
                            </span>
                          ) : (
                            <>
                              <span className="block text-xs text-ink/60 dark:text-paper/60">
                                {tExp('yourShare')}
                              </span>
                              {money(mine)}
                            </>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </GroupShell>
  );
}
