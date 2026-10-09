import type { ReactNode } from 'react';
import { BackLink, Link, cn, type Translate } from '@devquake/ui';
import type { Group } from '../lib/data';
import { KIND_ICONS } from '../lib/model';

export type GroupTab = 'expenses' | 'balances' | 'activity' | 'stats' | 'members';

const TABS: { tab: GroupTab; path: string }[] = [
  { tab: 'expenses', path: '' },
  { tab: 'balances', path: '/balances' },
  { tab: 'activity', path: '/activity' },
  { tab: 'stats', path: '/stats' },
  { tab: 'members', path: '/members' },
];

/** A balance as words and colour: owed (green), owes (red) or settled. */
export function BalanceText({
  cents,
  money,
  t,
  className,
}: {
  cents: number;
  money: (amount: number) => string;
  t: Translate;
  className?: string;
}) {
  if (cents === 0) {
    return <span className={cn('text-ink/60 dark:text-paper/60', className)}>{t('settled')}</span>;
  }
  return cents > 0 ? (
    <span className={cn('text-green-700 dark:text-green-400', className)}>
      {t('owed', { amount: money(cents / 100) })}
    </span>
  ) : (
    <span className={cn('text-red-700 dark:text-red-400', className)}>
      {t('owe', { amount: money(-cents / 100) })}
    </span>
  );
}

/** The group's header and its tabs: expenses, balances, activity, statistics and members. */
export function GroupShell({
  group,
  tab,
  members,
  balance,
  t,
  tKinds,
  children,
}: {
  group: Group;
  tab: GroupTab;
  /** Active members. */
  members: number;
  /** The visitor's balance in this group, in words. */
  balance: ReactNode;
  t: Translate;
  tKinds: Translate;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
          {t('back')}
        </BackLink>
        <div className="mt-2 flex items-center gap-4">
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-quake/10 text-3xl"
          >
            {KIND_ICONS[group.kind]}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold break-words">{group.name}</h1>
            <p className="text-sm text-ink/70 dark:text-paper/70">
              {[tKinds(group.kind), group.currency, t('membersCount', { count: members })].join(
                ' · ',
              )}
            </p>
            <p className="text-sm font-medium">{balance}</p>
          </div>
        </div>
      </div>
      <nav
        aria-label={t('tabs.label')}
        className="flex gap-1 overflow-x-auto border-b border-ink/10 text-sm [scrollbar-width:none] dark:border-paper/10"
      >
        {TABS.map((x) => (
          <Link
            key={x.tab}
            href={`/groups/${group.id}${x.path}`}
            aria-current={x.tab === tab ? 'page' : undefined}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2.5 font-medium whitespace-nowrap',
              x.tab === tab
                ? 'border-quake text-ink dark:text-paper'
                : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
            )}
          >
            {t(`tabs.${x.tab}`)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
