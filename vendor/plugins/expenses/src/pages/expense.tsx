import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, LOCALE_TAGS, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { CommentForm, DeleteComment, ExpenseEditor } from '../components/expense-actions';
import { groupScope, moneyIn, nameOf } from '../components/guard';
import { Panel } from '../components/ui';
import { commentsOf, expenseById, groupById } from '../lib/data';
import { formatDayLong } from '../lib/dates';
import { categoryIcon } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const group =
    ctx.db && ctx.user ? await groupById(ctx.db, Number(params.id)).catch(() => null) : null;
  return { title: group ? t('meta.group', { name: group.name }) : t('meta.home') };
}

/** One expense: who paid, everyone's part, the note, edit and delete, and the comments. */
export default async function ExpensePage({ ctx, params }: PluginPageProps) {
  const scope = await groupScope(ctx, params);
  if (!scope.ok) return scope.notice;
  const { db, group, me, members, locale, timeZone } = scope;
  const expenseId = Number(params.expenseId);
  if (!Number.isSafeInteger(expenseId) || expenseId <= 0) notFound();
  const expense = await expenseById(db, group.id, expenseId);
  if (!expense) notFound();
  const comments = await commentsOf(db, expense.id);
  // Added by another app ("utilities:bill:42"): its name, and its page with a way back.
  const [sourceApp, sourceTarget, sourceId] = expense.source?.split(':') ?? [];
  const linked =
    sourceApp && ctx.links
      ? (await ctx.links.list().catch(() => [])).find((a) => a.app === sourceApp)
      : undefined;
  const sourceUrl =
    linked && sourceTarget && sourceId
      ? ctx.links!.deepLink(
          sourceApp!,
          sourceTarget,
          { id: sourceId },
          {
            returnTo: `/groups/${group.id}/expenses/${expense.id}`,
          },
        )
      : null;
  const t = translator(locale);
  const tExp = translator(locale, 'expenses');
  const tComments = translator(locale, 'comments');
  const money = moneyIn(locale, group.currency);
  const active = members.filter((m) => m.active);
  const unit = (input: number | null) =>
    input === null
      ? ''
      : expense.splitMode === 'percent'
        ? ` · ${input} %`
        : expense.splitMode === 'shares'
          ? ` · ${tExp('sharesCount', { count: input })}`
          : '';

  return (
    <div className="space-y-6">
      <div>
        <BackLink
          href={`/groups/${group.id}`}
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {tExp('back', { name: group.name })}
        </BackLink>
        <div className="mt-2 flex items-center gap-4">
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-quake/10 text-3xl"
          >
            {categoryIcon(expense.category)}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold break-words">{expense.title}</h1>
            <p className="text-lg font-semibold tabular-nums">{money(expense.amount)}</p>
            <p className="text-sm text-ink/70 dark:text-paper/70">
              {[
                tExp('paidByShort', { name: nameOf(members, expense.paidBy, t) }),
                formatDayLong(expense.spentOn, LOCALE_TAGS[locale]),
                t(`categories.${expense.category}`),
                t(`splitModes.${expense.splitMode}`),
              ].join(' · ')}
            </p>
          </div>
        </div>
      </div>

      <Panel flush>
        <h2 className="px-5 pt-4 font-display text-lg font-semibold">{tExp('sharesTitle')}</h2>
        <ul className="divide-y divide-ink/10 dark:divide-paper/10">
          {expense.shares.map((s) => (
            <li
              key={s.memberId}
              className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
            >
              <span>
                {nameOf(members, s.memberId, t)}
                {s.memberId === me.memberId ? ` (${tExp('you')})` : ''}
                <span className="text-ink/60 dark:text-paper/60">{unit(s.input)}</span>
              </span>
              <span className="tabular-nums">{money(s.amount)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {linked ? (
        <p className="text-sm text-ink/70 dark:text-paper/70">
          {tExp('fromApp', { app: linked.name })}
          {sourceUrl ? (
            <>
              {' · '}
              <a href={sourceUrl} className="font-medium text-quake underline">
                {tExp('openSource', { app: linked.name })}
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {expense.note ? (
        <p className="whitespace-pre-line rounded-xl border-l-4 border-quake/40 bg-quake/5 px-4 py-3 text-sm">
          {expense.note}
        </p>
      ) : null}

      <ExpenseEditor
        groupId={group.id}
        currency={group.currency}
        members={active.map((m) => ({ id: m.id, name: m.name }))}
        me={me.memberId}
        today={scope.today}
        expense={{
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          paidBy: expense.paidBy,
          splitMode: expense.splitMode,
          category: expense.category,
          spentOn: expense.spentOn,
          note: expense.note,
          shares: expense.shares.map((s) => ({ memberId: s.memberId, input: s.input })),
        }}
      />

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{tComments('title')}</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{tComments('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-ink/10 bg-white/70 p-3 dark:border-paper/10 dark:bg-paper/5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-ink/60 dark:text-paper/60">
                  <span className="font-medium text-ink dark:text-paper">
                    {nameOf(members, c.memberId, t)}
                  </span>
                  <span className="flex items-center gap-1">
                    {formatDateTime(c.createdAt, timeZone, 'datetime', locale)}
                    {c.memberId === me.memberId || me.isOwner ? (
                      <DeleteComment groupId={group.id} commentId={c.id} />
                    ) : null}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
        <CommentForm groupId={group.id} expenseId={expense.id} />
      </section>

      <p className="text-xs text-ink/50 dark:text-paper/50">
        {tExp('added', {
          when: formatDateTime(expense.createdAt, timeZone, 'datetime', locale),
          name: nameOf(members, expense.createdBy, t),
        })}
      </p>
    </div>
  );
}
