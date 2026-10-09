'use client';

import { useMemo, useState } from 'react';
import { LOCALE_TAGS, Link, cn, useDaySelection, useLocale, useT } from '@devquake/ui';
import { addMonths, formatDay } from '../lib/dates';
import { category } from '../lib/model';
import { monthSummaries, moneyTotals, type MoneyTotals, type OverviewBill } from '../lib/overview';
import { StatusBadge, statusTextClass } from './status';
import { useFormat } from './use-format';

type View = 'month' | 'year';

const muted = 'text-ink/60 dark:text-paper/60';

/** The user's own part of every bill, by month or by year. */
export function Calendar({ bills, thisMonth }: { bills: OverviewBill[]; thisMonth: string }) {
  const t = useT('calendar');
  const f = useFormat();
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(thisMonth);
  const year = Number(cursor.slice(0, 4));
  const months = useMemo(() => monthSummaries(bills, year), [bills, year]);
  const month = months[Number(cursor.slice(5, 7)) - 1]!;

  // Month view: a clicked due date lists its bills; year view: a clicked month lists its bills.
  // Clicking it again, or changing the view, shows everything again.
  const { selected, toggle, clear } = useDaySelection(view);
  const step = (direction: 1 | -1) => {
    clear();
    setCursor(view === 'month' ? addMonths(cursor, direction) : addMonths(cursor, 12 * direction));
  };
  const tag = LOCALE_TAGS[useLocale()];
  const picked = selected ? months.find((m) => m.month === selected) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <NavButton label={t('previous')} onClick={() => step(-1)}>
            ‹
          </NavButton>
          <NavButton label={t('next')} onClick={() => step(1)}>
            ›
          </NavButton>
          <h2 className="ml-2 font-display text-lg font-semibold">
            {view === 'month' ? f.month(cursor) : year}
          </h2>
          <button
            type="button"
            onClick={() => {
              setCursor(thisMonth);
              clear();
            }}
            className="ml-2 rounded-md px-2 py-1 text-xs text-ink/70 underline hover:text-quake dark:text-paper/70"
          >
            {t('today')}
          </button>
        </div>
        <div
          role="group"
          aria-label={t('view')}
          className="flex rounded-md border border-ink/15 p-0.5 dark:border-paper/15"
        >
          {(['month', 'year'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                'rounded px-3 py-1 text-sm',
                view === v
                  ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                  : 'text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-paper/10',
              )}
            >
              {t(v)}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <>
          <DueDays month={cursor} bills={bills} selected={selected} onDay={toggle} />
          {selected ? (
            <Picked
              title={formatDay(selected, tag)}
              onClear={clear}
              bills={bills.filter((b) => b.dueOn === selected)}
            />
          ) : (
            <MonthView bills={month.bills} money={month.money} />
          )}
        </>
      ) : (
        <>
          <YearView
            months={months}
            money={moneyTotals(months.flatMap((m) => m.bills))}
            selected={selected}
            onPick={toggle}
          />
          {picked ? (
            <Picked title={f.month(picked.month)} onClear={clear} bills={picked.bills} />
          ) : null}
        </>
      )}
    </div>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="size-8 rounded-md border border-ink/15 text-lg leading-none hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10"
    >
      {children}
    </button>
  );
}

function Totals({ money }: { money: MoneyTotals[] }) {
  const t = useT('calendar');
  const f = useFormat();
  if (money.length === 0) return null;
  return (
    <dl className="grid grid-cols-3 gap-3">
      {money.map((m) => (
        <div key={m.currency} className="contents">
          <Figure label={t('myShare')} value={f.money(m.share, m.currency)} />
          <Figure label={t('paid')} value={f.money(m.paid, m.currency)} />
          <Figure label={t('billed')} value={f.money(m.billed, m.currency)} />
        </div>
      ))}
    </dl>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/70 p-3 dark:border-paper/10 dark:bg-paper/5">
      <dt className={`text-xs ${muted}`}>{label}</dt>
      <dd className="font-display text-xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function MonthView({ bills, money }: { bills: OverviewBill[]; money: MoneyTotals[] }) {
  const t = useT('calendar');
  const tCat = useT('categories');
  const tStatus = useT('status');
  const f = useFormat();
  if (bills.length === 0) return <p className={`text-sm ${muted}`}>{t('noBills')}</p>;
  return (
    <div className="space-y-4">
      <Totals money={money} />
      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5">
        <table className="w-full text-sm">
          <thead className={`text-left text-xs ${muted}`}>
            <tr>
              <th className="px-3 py-2 font-medium">{t('bill')}</th>
              <th className="px-3 py-2 font-medium">{t('status')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('myConsumption')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('myShare')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('paid')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
            {bills.map((b) => (
              <tr key={b.billId}>
                <td className="px-3 py-2">
                  <Link href={`/bills/${b.billId}`} className="font-medium hover:text-quake">
                    <span aria-hidden>{category(b.category).icon} </span>
                    {b.utilityName}
                  </Link>
                  <span className={`block text-xs ${muted}`}>{tCat(b.category)}</span>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={b.status} t={tStatus} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {b.myConsumption === null ? '—' : f.amount(b.myConsumption, b.unit)}
                </td>
                <td className={cn('px-3 py-2 text-right tabular-nums', statusTextClass(b.status))}>
                  {b.myShare === null ? '—' : f.money(b.myShare, b.currency)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {f.money(b.myPaid, b.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function YearView({
  months,
  money,
  selected,
  onPick,
}: {
  months: ReturnType<typeof monthSummaries>;
  money: MoneyTotals[];
  selected: string | null;
  onPick: (month: string) => void;
}) {
  const t = useT('calendar');
  const f = useFormat();
  return (
    <div className="space-y-4">
      <Totals money={money} />
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {months.map((m) => (
          <li key={m.month}>
            <button
              type="button"
              onClick={() => onPick(m.month)}
              aria-pressed={selected === m.month}
              className={cn(
                'h-full w-full rounded-xl border bg-white/70 p-3 text-left hover:border-quake dark:bg-paper/5',
                selected === m.month
                  ? 'border-quake ring-2 ring-quake/40'
                  : 'border-ink/10 dark:border-paper/10',
              )}
            >
              <span className="block font-medium capitalize">{f.monthShort(m.month)}</span>
              {m.bills.length === 0 ? (
                <span className={`block text-sm ${muted}`}>—</span>
              ) : (
                <>
                  <span className={`block text-xs ${muted}`}>
                    {t('bills', { count: m.bills.length })}
                  </span>
                  {m.money.map((x) => (
                    <span key={x.currency} className="block text-sm tabular-nums">
                      {f.money(x.share, x.currency)}
                    </span>
                  ))}
                  {m.open > 0 ? (
                    <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-400">
                      <span aria-hidden>⚠ </span>
                      {t('open', { count: m.open })}
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <span aria-hidden>✔ </span>
                      {t('allPaid')}
                    </span>
                  )}
                </>
              )}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The month's days, Monday first; days with a bill due are marked and can be picked. */
function DueDays({
  month,
  bills,
  selected,
  onDay,
}: {
  month: string;
  bills: OverviewBill[];
  selected: string | null;
  onDay: (day: string) => void;
}) {
  const t = useT('calendar');
  const tag = LOCALE_TAGS[useLocale()];
  const due = new Map<string, number>();
  for (const b of bills) {
    if (b.dueOn?.startsWith(month)) due.set(b.dueOn, (due.get(b.dueOn) ?? 0) + 1);
  }
  const [y, m] = month.split('-').map(Number);
  const days = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y!, m! - 1, 1)).getUTCDay() + 6) % 7;
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2026, 0, 5 + i)).toLocaleDateString(tag, {
      weekday: 'short',
      timeZone: 'UTC',
    }),
  );
  return (
    <div>
      <p className={`mb-1 text-xs ${muted}`}>{t('dueDays')}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdays.map((d) => (
          <span key={d} className={muted}>
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = `${month}-${String(i + 1).padStart(2, '0')}`;
          const count = due.get(day) ?? 0;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onDay(day)}
              aria-pressed={selected === day}
              aria-label={`${formatDay(day, tag)}${count ? `, ${t('bills', { count })}` : ''}`}
              className={cn(
                'rounded py-1',
                count > 0 ? 'bg-quake/15 font-semibold' : 'hover:bg-ink/5 dark:hover:bg-paper/10',
                selected === day && 'bg-quake text-white',
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The bills of the picked day or month, with the way back to everything. */
function Picked({
  title,
  bills,
  onClear,
}: {
  title: string;
  bills: OverviewBill[];
  onClear: () => void;
}) {
  const t = useT('calendar');
  return (
    <section aria-live="polite" className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold capitalize">{title}</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-ink/70 underline hover:text-quake dark:text-paper/70"
        >
          {t('showAll')}
        </button>
      </div>
      {bills.length ? (
        <MonthView bills={bills} money={moneyTotals(bills)} />
      ) : (
        <p className={`text-sm ${muted}`}>{t('emptyDay')}</p>
      )}
    </section>
  );
}
