import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { GroupForm } from '../components/group-form';
import { BalanceText } from '../components/group-shell';
import { moneyIn, pageScope } from '../components/guard';
import { Panel } from '../components/ui';
import { groupsOf } from '../lib/data';
import { KIND_ICONS } from '../lib/model';
import { toCents } from '../lib/split';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

/** The visitor's groups with their balance in each, and a new group. */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale, 'home');
  const tGroup = translator(scope.locale, 'group');
  const tKinds = translator(scope.locale, 'kinds');
  const groups = await groupsOf(scope.db, scope.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const money = moneyIn(scope.locale, g.currency);
            return (
              <li key={g.id}>
                <Link
                  href={`/groups/${g.id}`}
                  className="flex h-full items-start gap-3 rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
                >
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-quake/10 text-2xl"
                  >
                    {KIND_ICONS[g.kind]}
                  </span>
                  <span className="min-w-0 space-y-0.5">
                    <span className="block truncate font-semibold">{g.name}</span>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {[
                        tKinds(g.kind),
                        tGroup('membersCount', { count: g.members }),
                        t('expensesCount', { count: g.expenses }),
                      ].join(' · ')}
                    </span>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {t('total', { amount: money(g.total) })}
                    </span>
                    <BalanceText
                      cents={toCents(g.myBalance)}
                      money={money}
                      t={tGroup}
                      className="block text-sm font-medium"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('newGroup')}</h2>
        <GroupForm />
      </Panel>
    </div>
  );
}
