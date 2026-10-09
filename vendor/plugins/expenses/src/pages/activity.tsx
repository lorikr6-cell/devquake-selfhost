import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { BalanceText, GroupShell } from '../components/group-shell';
import { groupScope, moneyIn, nameOf } from '../components/guard';
import { activityOf, groupById, ledgerOf } from '../lib/data';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const group =
    ctx.db && ctx.user ? await groupById(ctx.db, Number(params.id)).catch(() => null) : null;
  return { title: group ? t('meta.activity', { name: group.name }) : t('meta.home') };
}

const KINDS = new Set([
  'expense_added',
  'expense_edited',
  'expense_deleted',
  'payment_added',
  'payment_deleted',
  'member_joined',
  'member_left',
  'comment_added',
]);

/** What happened in the group, newest first. */
export default async function ActivityPage({ ctx, params }: PluginPageProps) {
  const scope = await groupScope(ctx, params);
  if (!scope.ok) return scope.notice;
  const { db, group, me, members, locale, timeZone } = scope;
  const t = translator(locale);
  const tGroup = translator(locale, 'group');
  const tAct = translator(locale, 'activity');
  const money = moneyIn(locale, group.currency);
  const [items, ledger] = await Promise.all([activityOf(db, group.id), ledgerOf(db, group.id)]);

  return (
    <GroupShell
      group={group}
      tab="activity"
      members={members.filter((m) => m.active).length}
      balance={
        <BalanceText cents={ledger.balance.get(me.memberId) ?? 0} money={money} t={tGroup} />
      }
      t={tGroup}
      tKinds={translator(locale, 'kinds')}
    >
      {items.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{tAct('empty')}</p>
      ) : (
        <ol className="space-y-3">
          {items
            .filter((a) => KINDS.has(a.kind))
            .map((a) => {
              const who = a.memberId === me.memberId ? tAct('you') : nameOf(members, a.memberId, t);
              const other = nameOf(members, a.otherId, t);
              // Someone else added or removed them, or they joined or left themselves.
              const byOther = a.otherId !== null && a.otherId !== a.memberId;
              const kind =
                a.kind === 'member_joined' && byOther
                  ? 'member_added'
                  : a.kind === 'member_left' && byOther
                    ? 'member_removed'
                    : a.kind;
              const text = tAct(kind, {
                who,
                other,
                title: a.title ?? '',
                amount: a.amount === null ? '' : money(a.amount),
              });
              // expenseId is set only while the expense still exists.
              const linked = a.expenseId !== null;
              return (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-quake/60" />
                  <span className="min-w-0">
                    {linked ? (
                      <Link
                        href={`/groups/${group.id}/expenses/${a.expenseId}`}
                        className="hover:underline"
                      >
                        {text}
                      </Link>
                    ) : (
                      text
                    )}
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {formatDateTime(a.createdAt, timeZone, 'datetime', locale)}
                    </span>
                  </span>
                </li>
              );
            })}
        </ol>
      )}
    </GroupShell>
  );
}
