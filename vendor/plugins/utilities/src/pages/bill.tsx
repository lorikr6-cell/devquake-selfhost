import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, Link, buttonClass, cn, formatDateTime, ZoomableImage } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import {
  CommentForm,
  DeleteBillButton,
  DeleteCommentButton,
  DeleteReadingButton,
  PaymentForm,
  ProviderPaidToggle,
} from '../components/bill-actions';
import { pageScope, requireProfile } from '../components/guard';
import { ExpenseCard, type ExpenseGroupChoice } from '../components/expense-card';
import { ReadingForm } from '../components/reading-form';
import { LineBadge, StatusBadge, statusTextClass } from '../components/status';
import { Panel } from '../components/ui';
import { HttpError, billContext, commentsOf, lastIndex } from '../lib/data';
import { todayIn } from '../lib/dates';
import { fittingGroups, type ExpenseGroup } from '../lib/expense-link';
import { formatters } from '../lib/format';
import { category } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.bill') };
}

const muted = 'text-ink/60 dark:text-paper/60';

/**
 * One bill: the provider's figures and PDF, how it is split (readings, shares, carry-over,
 * payments), the reading forms, the owner's payment records, and the comments.
 */
export default async function BillPage({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const billId = Number(params.id);
  if (!Number.isSafeInteger(billId) || billId <= 0) notFound();
  await requireProfile(ctx, db, user, `/bills/${billId}`);
  const context = await billContext(db, billId, user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  const { utility, bill, split } = context;
  const locale = localeOf(ctx);
  const t = translator(locale, 'billPage');
  const tStatus = translator(locale, 'status');
  const tLine = translator(locale, 'lineState');
  const tPay = translator(locale, 'payment');
  const f = formatters(LOCALE_TAGS[locale]);
  const isOwner = utility.role === 'owner';
  const cur = utility.currency;
  const today = todayIn(ctx.timeZone);
  const comments = await commentsOf(db, billId, user.id);
  const me = split.lines.find((l) => l.userId === user.id) ?? null;

  // The owner can put the bill into a Shared expenses group (ADR 0035, 0055): only groups with
  // the utility's currency that everyone on the bill is in.
  let expenseGroups: ExpenseGroupChoice[] | null = null;
  let expenseConnect: string | null = null;
  if (isOwner && ctx.links) {
    const app = (await ctx.links.list().catch(() => [])).find((a) => a.app === 'expenses');
    if (app?.state === 'connected') {
      const res = await ctx.links.call<{ groups?: ExpenseGroup[] }>('expenses', 'groups.overview');
      expenseGroups = res.ok
        ? fittingGroups(
            res.data.groups ?? [],
            cur,
            split.lines.map((l) => l.userId),
          ).map((g) => ({ id: g.id, name: g.name }))
        : [];
    } else if (app) {
      expenseConnect = app.state === 'available' ? app.connectUrl : app.openUrl;
    }
  }

  // Default "previous index" for each reading form: the reading's own, or the participant's
  // last index on an earlier bill.
  const readingTargets = utility.meterRequired
    ? split.lines.filter((l) => l.userId === user.id || isOwner)
    : [];
  const previousIndexes = new Map<number, number | null>(
    await Promise.all(
      readingTargets.map(async (l): Promise<[number, number | null]> => {
        const own = bill.readings.get(l.userId)?.previousIndex ?? null;
        return [l.userId, own ?? (await lastIndex(db, utility.id, l.userId, bill.id))];
      }),
    ),
  );
  const readingInitial = (userId: number) => {
    const r = bill.readings.get(userId);
    return {
      previousIndex: previousIndexes.get(userId) ?? null,
      currentIndex: r?.currentIndex ?? null,
      consumption: r?.consumption ?? null,
    };
  };
  const photoUrl = (userId: number) => {
    const v = bill.readings.get(userId)?.photoVersion;
    return v ? `/api/bills/${bill.id}/readings/${userId}/photo?v=${v}` : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/utilities/${utility.id}`} className={`text-sm hover:text-quake ${muted}`}>
            <span aria-hidden>{category(utility.category).icon} </span>
            {utility.name}
          </Link>
          <h1 className="font-display text-3xl font-bold capitalize">{f.month(bill.period)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <StatusBadge status={split.status} t={tStatus} />
            {bill.dueOn ? (
              <span className={`text-sm ${muted}`}>{t('due', { day: f.day(bill.dueOn) })}</span>
            ) : null}
            <span className={`text-sm ${muted}`}>
              {bill.providerPaid ? t('providerPaidYes') : t('providerPaidNo')}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bill.fileName ? (
            <a
              href={`/api/bills/${bill.id}/file`}
              className={buttonClass('secondary')}
              target="_blank"
              rel="noopener"
            >
              📄 {t('openPdf')}
            </a>
          ) : null}
          {isOwner ? (
            <Link href={`/bills/${bill.id}/edit`} className={buttonClass('secondary')}>
              {t('edit')}
            </Link>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure
          label={t('total')}
          value={f.money(bill.total, cur)}
          className={statusTextClass(split.status)}
        />
        <Figure
          label={t('consumption')}
          value={bill.consumption === null ? '—' : f.amount(bill.consumption, utility.unit)}
        />
        <Figure
          label={t('unitPrice')}
          value={split.unitPrice === null ? '—' : f.unitPrice(split.unitPrice, cur, utility.unit)}
          hint={split.unitPrice !== null && bill.unitPrice === null ? t('derived') : undefined}
        />
        <Figure
          label={isOwner ? t('owedToYou') : t('youOwe')}
          value={
            isOwner
              ? f.money(split.outstanding, cur)
              : me?.due === null || me === null
                ? '—'
                : f.money(Math.max(0, me.due - (me.paid ?? 0)), cur)
          }
        />
      </dl>

      {bill.note ? <p className={`text-sm ${muted}`}>{bill.note}</p> : null}

      {!me ? (
        <p className="rounded-lg bg-ink/5 px-4 py-3 text-sm dark:bg-paper/10">
          <span aria-hidden>👁 </span>
          {t('viewOnlyNote')}
        </p>
      ) : null}

      <Panel flush>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
          <h2 className="font-display text-lg font-semibold">{t('splitTitle')}</h2>
          {isOwner ? <ProviderPaidToggle billId={bill.id} paid={bill.providerPaid} /> : null}
        </div>
        <p className={`px-4 pt-1 text-sm ${muted}`}>
          {utility.meterRequired
            ? split.readingsComplete
              ? split.remainder !== null && Math.abs(split.remainder) >= 0.005
                ? t(split.remainder > 0 ? 'remainderShared' : 'surplusShared', {
                    amount: f.money(Math.abs(split.remainder), cur),
                    count: split.lines.length,
                  })
                : t('byMeter')
              : t('waiting', { count: split.missingReadings })
            : t('equal', { count: split.lines.length })}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`text-left text-xs ${muted}`}>
              <tr>
                <th className="px-4 py-2 font-medium">{t('person')}</th>
                {utility.meterRequired ? (
                  <th className="px-4 py-2 font-medium">{t('reading')}</th>
                ) : null}
                <th className="px-4 py-2 text-right font-medium">{t('share')}</th>
                <th className="px-4 py-2 text-right font-medium">{t('carry')}</th>
                <th className="px-4 py-2 text-right font-medium">{t('dueCol')}</th>
                <th className="px-4 py-2 text-right font-medium">{t('paid')}</th>
                <th className="px-4 py-2 font-medium">{t('state')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 tabular-nums dark:divide-paper/10">
              {split.lines.map((l) => {
                const reading = bill.readings.get(l.userId);
                const photo = photoUrl(l.userId);
                return (
                  <tr key={l.userId} className={cn(l.userId === user.id && 'bg-quake/5')}>
                    <td className="px-4 py-2">
                      <span className="font-medium">{l.displayName}</span>
                      {l.userId === user.id ? <span className={muted}> {t('you')}</span> : null}
                    </td>
                    {utility.meterRequired ? (
                      <td className="px-4 py-2">
                        {reading ? (
                          <>
                            {f.amount(reading.consumption, utility.unit)}
                            {reading.currentIndex !== null ? (
                              <span className={`block text-xs ${muted}`}>
                                {f.amount(reading.previousIndex ?? 0)} →{' '}
                                {f.amount(reading.currentIndex)}
                              </span>
                            ) : null}
                            {photo ? (
                              <ZoomableImage
                                src={photo}
                                alt={t('photo')}
                                className="size-9 shrink-0 overflow-hidden rounded-md align-middle"
                                imgClassName="size-full object-cover"
                              />
                            ) : null}
                          </>
                        ) : (
                          <span className={muted}>—</span>
                        )}
                      </td>
                    ) : null}
                    <td className="px-4 py-2 text-right">
                      {l.share === null ? (
                        l.base === null ? (
                          '—'
                        ) : (
                          <span className={muted}>
                            {t('provisional', { amount: f.money(l.base, cur) })}
                          </span>
                        )
                      ) : (
                        <>
                          {f.money(l.share, cur)}
                          {l.extra !== null && l.base !== null && Math.abs(l.extra) >= 0.005 ? (
                            <span className={`block text-xs ${muted}`}>
                              {f.money(l.base, cur)} {l.extra >= 0 ? '+' : '−'}{' '}
                              {f.money(Math.abs(l.extra), cur)}
                            </span>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {l.isOwner || Math.abs(l.carry) < 0.005 ? (
                        <span className={muted}>—</span>
                      ) : (
                        <span title={l.carry > 0 ? t('creditTitle') : t('debtTitle')}>
                          {l.carry > 0 ? '−' : '+'}
                          {f.money(Math.abs(l.carry), cur)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {l.due === null ? (
                        <span className={muted}>—</span>
                      ) : (
                        f.money(Math.max(0, l.due), cur)
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {l.paid === null ? (
                        <span className={muted}>—</span>
                      ) : (
                        <>
                          {f.money(l.paid, cur)}
                          {l.difference !== null && Math.abs(l.difference) >= 0.005 ? (
                            <span
                              className={cn(
                                'block text-xs',
                                l.difference > 0
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400',
                              )}
                            >
                              {l.difference > 0
                                ? t('extra', { amount: f.money(l.difference, cur) })
                                : t('missingAmount', { amount: f.money(-l.difference, cur) })}
                            </span>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <LineBadge state={l.state} t={tLine} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={`px-4 py-3 text-xs ${muted}`}>{t('carryHint')}</p>
      </Panel>

      {utility.meterRequired && me ? (
        <Panel>
          <h2 className="font-display text-lg font-semibold">{t('myReading')}</h2>
          <p className={`mt-1 text-sm ${muted}`}>{t('myReadingBody')}</p>
          <div className="mt-4">
            <ReadingForm
              billId={bill.id}
              userId={user.id}
              unit={utility.unit}
              meterRequired
              hasPhoto={photoUrl(user.id) !== null}
              initial={readingInitial(user.id)}
            />
          </div>
          {bill.readings.has(user.id) ? (
            <div className="mt-2">
              <DeleteReadingButton billId={bill.id} userId={user.id} />
            </div>
          ) : null}
        </Panel>
      ) : null}

      {isOwner && split.lines.some((l) => !l.isOwner) ? (
        <Panel>
          <h2 className="font-display text-lg font-semibold">{t('ownerTitle')}</h2>
          <p className={`mt-1 text-sm ${muted}`}>{t('ownerBody')}</p>
          <ul className="mt-3 space-y-2">
            {split.lines
              .filter((l) => !l.isOwner)
              .map((l) => {
                const payment = bill.payments.get(l.userId) ?? null;
                return (
                  <li
                    key={l.userId}
                    className="rounded-lg border border-ink/10 dark:border-paper/10"
                  >
                    <details>
                      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <span className="font-medium">{l.displayName}</span>
                        <span className="flex items-center gap-3 text-sm">
                          {payment ? (
                            <span className={muted}>
                              {t('received', {
                                amount: f.money(payment.amount, cur),
                                method: tPay(`methods.${payment.method}`),
                              })}
                            </span>
                          ) : null}
                          <LineBadge state={l.state} t={tLine} />
                        </span>
                      </summary>
                      <div className="space-y-6 border-t border-ink/10 px-4 py-4 dark:border-paper/10">
                        <section>
                          <h3 className="mb-2 text-sm font-semibold">{t('recordPayment')}</h3>
                          <PaymentForm
                            billId={bill.id}
                            userId={l.userId}
                            name={l.displayName}
                            isAdmin={user.isAdmin}
                            due={l.due === null ? null : Math.max(0, l.due)}
                            currency={cur}
                            initial={payment}
                            today={today}
                          />
                        </section>
                        {utility.meterRequired ? (
                          <section>
                            <h3 className="mb-2 text-sm font-semibold">
                              {t('readingFor', { name: l.displayName })}
                            </h3>
                            <ReadingForm
                              billId={bill.id}
                              userId={l.userId}
                              unit={utility.unit}
                              meterRequired
                              hasPhoto={photoUrl(l.userId) !== null}
                              initial={readingInitial(l.userId)}
                            />
                          </section>
                        ) : null}
                      </div>
                    </details>
                  </li>
                );
              })}
          </ul>
        </Panel>
      ) : null}

      {expenseGroups || expenseConnect ? (
        <Panel>
          <ExpenseCard
            billId={bill.id}
            groups={expenseGroups}
            connectUrl={expenseConnect}
            ready={split.lines.every((l) => l.share !== null)}
          />
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-display text-lg font-semibold">
          {t('comments', { count: comments.length })}
        </h2>
        {comments.length === 0 ? (
          <p className={`mt-2 text-sm ${muted}`}>{t('noComments')}</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg bg-ink/5 px-3 py-2 dark:bg-paper/5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium">{c.userName}</span>
                  <span className={muted}>
                    {formatDateTime(c.at, ctx.timeZone ?? 'UTC', 'datetime', locale)}
                    {c.userId === user.id || isOwner ? (
                      <>
                        {' · '}
                        <DeleteCommentButton billId={bill.id} commentId={c.id} />
                      </>
                    ) : null}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm">{c.body}</p>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4">
          <CommentForm billId={bill.id} />
        </div>
      </Panel>

      {isOwner ? (
        <div className="flex justify-end">
          <DeleteBillButton billId={bill.id} utilityId={utility.id} />
        </div>
      ) : null}
    </div>
  );
}

function Figure({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/70 p-3 dark:border-paper/10 dark:bg-paper/5">
      <dt className={`text-xs ${muted}`}>{label}</dt>
      <dd className={cn('font-display text-xl font-bold tabular-nums', className)}>{value}</dd>
      {hint ? <dd className={`text-xs ${muted}`}>{hint}</dd> : null}
    </div>
  );
}
