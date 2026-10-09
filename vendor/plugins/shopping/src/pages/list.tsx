import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { ExpenseCard, type ExpenseGroupChoice } from '../components/expense-card';
import { ListView } from '../components/list-view';
import { Panel } from '../components/ui';
import { HttpError, refreshMemberName, snapshot } from '../lib/data';
import { boughtTotal, fittingGroups, type ExpenseGroup } from '../lib/expense-link';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.list') };
}

export default async function ListPage({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const listId = Number(params.id);
  if (!Number.isSafeInteger(listId) || listId <= 0) notFound();

  const list = await snapshot(scope.db, listId, scope.user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  await refreshMemberName(scope.db, listId, scope.user);

  // What was bought can become a shared expense (ADR 0035, 0055): only groups with the list's
  // currency that everyone on the list is in.
  let expenseGroups: ExpenseGroupChoice[] | null = null;
  let expenseConnect: string | null = null;
  if (ctx.links) {
    const app = (await ctx.links.list().catch(() => [])).find((a) => a.app === 'expenses');
    if (app?.state === 'connected') {
      const res = await ctx.links.call<{ groups?: ExpenseGroup[] }>('expenses', 'groups.overview');
      expenseGroups = res.ok
        ? fittingGroups(
            res.data.groups ?? [],
            list.currency,
            list.members.map((m) => m.userId),
          ).map((g) => ({ id: g.id, name: g.name }))
        : [];
    } else if (app) {
      expenseConnect = app.state === 'available' ? app.connectUrl : app.openUrl;
    }
  }

  return (
    <>
      <ListView initial={list} />
      {expenseGroups || expenseConnect ? (
        <Panel className="mt-6">
          <ExpenseCard
            listId={list.id}
            groups={expenseGroups}
            connectUrl={expenseConnect}
            ready={boughtTotal(list.items) > 0}
          />
        </Panel>
      ) : null}
    </>
  );
}
