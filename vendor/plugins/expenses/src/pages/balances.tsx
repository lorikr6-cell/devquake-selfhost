import type { PluginPageProps } from '@devquake/plugin-sdk';
import { LOCALE_TAGS } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { BalanceText, GroupShell } from '../components/group-shell';
import { groupScope, moneyIn, nameOf } from '../components/guard';
import { DeletePayment, RecordPayment } from '../components/payments';
import { Panel } from '../components/ui';
import { groupById, ledgerOf, paymentsOf } from '../lib/data';
import { formatDayShort } from '../lib/dates';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const group =
    ctx.db && ctx.user ? await groupById(ctx.db, Number(params.id)).catch(() => null) : null;
  return { title: group ? t('meta.balances', { name: group.name }) : t('meta.home') };
}

/** Who is owed and who owes, the fewest transfers to settle up, and the payments made. */
export default async function BalancesPage({ ctx, params }: PluginPageProps) {
  const scope = await groupScope(ctx, params);
  if (!scope.ok) return scope.notice;
  const { db, group, me, members, locale } = scope;
  const t = translator(locale);
  const tGroup = translator(locale, 'group');
  const tBal = translator(locale, 'balances');
  const tPay = translator(locale, 'payments');
  const money = moneyIn(locale, group.currency);
  const [ledger, payments] = await Promise.all([ledgerOf(db, group.id), paymentsOf(db, group.id)]);
  // Everyone who still has a balance or is active can pay and be paid.
  const payable = members
    .filter((m) => m.active || (ledger.balance.get(m.id) ?? 0) !== 0)
    .map((m) => ({ id: m.id, name: nameOf(members, m.id, t) }));
  const paymentProps = {
    groupId: group.id,
    currency: group.currency,
    members: payable,
    today: scope.today,
  };
  const shown = members.filter((m) => m.active || (ledger.balance.get(m.id) ?? 0) !== 0);

  return (
    <GroupShell
      group={group}
      tab="balances"
      members={members.filter((m) => m.active).length}
      balance={
        <BalanceText cents={ledger.balance.get(me.memberId) ?? 0} money={money} t={tGroup} />
      }
      t={tGroup}
      tKinds={translator(locale, 'kinds')}
    >
      <Panel flush>
        <h2 className="px-5 pt-4 font-display text-lg font-semibold">{tBal('title')}</h2>
        <ul className="divide-y divide-ink/10 dark:divide-paper/10">
          {shown.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm"
            >
              <span>
                {nameOf(members, m.id, t)}
                {m.id === me.memberId ? ` (${tBal('you')})` : ''}
                {!m.active ? (
                  <span className="text-ink/50 dark:text-paper/50"> · {tBal('former')}</span>
                ) : null}
              </span>
              <BalanceText
                cents={ledger.balance.get(m.id) ?? 0}
                money={money}
                t={tBal}
                className="font-medium"
              />
            </li>
          ))}
        </ul>
      </Panel>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{tBal('planTitle')}</h2>
        {ledger.transfers.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{tBal('planEmpty')}</p>
        ) : (
          <>
            <p className="text-sm text-ink/70 dark:text-paper/70">{tBal('planIntro')}</p>
            <ul className="space-y-2">
              {ledger.transfers.map((x) => (
                <li
                  key={`${x.from}-${x.to}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white/70 px-4 py-3 dark:border-paper/10 dark:bg-paper/5"
                >
                  <span className="text-sm">
                    {tBal('transfer', {
                      from: nameOf(members, x.from, t),
                      to: nameOf(members, x.to, t),
                      amount: money(x.cents / 100),
                    })}
                  </span>
                  <RecordPayment
                    {...paymentProps}
                    from={x.from}
                    to={x.to}
                    cents={x.cents}
                    label={tBal('markPaid')}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
        <RecordPayment {...paymentProps} from={me.memberId} variant="secondary" />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{tPay('historyTitle')}</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{tPay('historyEmpty')}</p>
        ) : (
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/70 dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
            {payments.map((p) => {
              const line = tPay('line', {
                from: nameOf(members, p.from, t),
                to: nameOf(members, p.to, t),
                amount: money(p.amount),
              });
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block">{line}</span>
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {[formatDayShort(p.paidOn, LOCALE_TAGS[locale]), p.note]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <DeletePayment groupId={group.id} paymentId={p.id} line={line} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </GroupShell>
  );
}
