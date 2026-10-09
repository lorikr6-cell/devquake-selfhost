'use client';

import { useMemo, useState } from 'react';
import { Link, cn, useDaySelection, useT } from '@devquake/ui';
import type { ListSummary } from '../lib/data';
import { addDays, addMonths, monthGrid, weekDays, type IsoDate } from '../lib/dates';
import { useFormat } from './use-format';
import { useToday } from './use-today';

type View = 'year' | 'month' | 'week';

const VIEWS: View[] = ['week', 'month', 'year'];

/** All the user's lists on a calendar (year / month / week); past and future alike. */
export function Calendar({ lists, serverToday }: { lists: ListSummary[]; serverToday: IsoDate }) {
  const t = useT('calendar');
  const f = useFormat();
  const today = useToday(serverToday);
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState<IsoDate | null>(null);
  const at = cursor ?? today;
  // A clicked day lists only that day; clicking it again or another view shows everything.
  const { selected, toggle, clear } = useDaySelection(view);

  const byDay = useMemo(() => {
    const map = new Map<IsoDate, ListSummary[]>();
    for (const l of lists) map.set(l.shopDate, [...(map.get(l.shopDate) ?? []), l]);
    return map;
  }, [lists]);

  const step = (direction: 1 | -1) => {
    clear();
    if (view === 'week') setCursor(addDays(at, 7 * direction));
    else if (view === 'month') setCursor(addMonths(at, direction));
    else setCursor(`${Number(at.slice(0, 4)) + direction}-01-01`);
  };
  const title =
    view === 'year'
      ? at.slice(0, 4)
      : view === 'month'
        ? f.month(at)
        : `${f.day(weekDays(at)[0]!, 'short')} – ${f.day(weekDays(at)[6]!, 'short')}`;

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
          <h2 className="ml-2 font-display text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => {
              setCursor(null);
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
          {VIEWS.map((v) => (
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

      {view === 'week' ? (
        <WeekView
          days={weekDays(at)}
          byDay={byDay}
          today={today}
          selected={selected}
          onDay={toggle}
        />
      ) : view === 'month' ? (
        <MonthView month={at} byDay={byDay} today={today} selected={selected} onDay={toggle} />
      ) : (
        <YearView
          year={at.slice(0, 4)}
          byDay={byDay}
          today={today}
          selected={selected}
          onDay={toggle}
          onPickMonth={(m) => {
            setCursor(m);
            setView('month');
          }}
        />
      )}
      {lists.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('none')}</p>
      ) : (
        <DayList
          byDay={byDay}
          selected={selected}
          inPeriod={(d) =>
            view === 'week'
              ? weekDays(at).includes(d)
              : view === 'month'
                ? d.slice(0, 7) === at.slice(0, 7)
                : d.slice(0, 4) === at.slice(0, 4)
          }
          title={selected ? f.day(selected) : t('allIn', { period: title })}
          onClear={selected ? clear : null}
        />
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

function ListChip({ list, compact = false }: { list: ListSummary; compact?: boolean }) {
  const t = useT('calendar');
  const f = useFormat();
  const allDone = list.open === 0 && list.done > 0;
  return (
    <Link
      href={`/lists/${list.id}`}
      title={t('listTitle', {
        name: list.name,
        open: list.open,
        total: f.money(list.total, list.currency),
      })}
      className={cn(
        'block truncate rounded px-1.5 py-0.5 text-xs font-medium',
        allDone
          ? 'bg-ink/5 text-ink/50 line-through dark:bg-paper/10 dark:text-paper/50'
          : 'bg-quake/15 text-ink hover:bg-quake/25 dark:text-paper',
        compact && 'px-1 text-[11px]',
      )}
    >
      {list.name}
    </Link>
  );
}

function WeekView({
  days,
  byDay,
  today,
  selected,
  onDay,
}: {
  days: IsoDate[];
  byDay: Map<IsoDate, ListSummary[]>;
  today: IsoDate;
  selected: IsoDate | null;
  onDay: (day: IsoDate) => void;
}) {
  const t = useT('calendar');
  const f = useFormat();
  return (
    <ol className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/70 dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
      {days.map((day) => {
        const lists = byDay.get(day) ?? [];
        return (
          <li key={day} className={cn('flex gap-3 px-4 py-3', selected === day && 'bg-quake/10')}>
            <button
              type="button"
              onClick={() => onDay(day)}
              aria-pressed={selected === day}
              className={cn(
                'w-24 shrink-0 rounded text-left text-sm hover:text-quake',
                day === today && 'font-semibold text-quake',
              )}
            >
              {f.day(day, 'short')}
              {day === today ? <span className="block text-xs">{t('today')}</span> : null}
            </button>
            <div className="min-w-0 flex-1 space-y-1.5">
              {lists.length === 0 ? (
                <p className="text-sm text-ink/40 dark:text-paper/40">—</p>
              ) : (
                lists.map((l) => (
                  <Link
                    key={l.id}
                    href={`/lists/${l.id}`}
                    className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1 hover:bg-ink/5 dark:hover:bg-paper/10"
                  >
                    <span className="truncate font-medium">{l.name}</span>
                    <span className="shrink-0 text-xs text-ink/60 tabular-nums dark:text-paper/60">
                      {t('toBuy', { open: l.open, total: f.money(l.total, l.currency) })}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MonthView({
  month,
  byDay,
  today,
  selected,
  onDay,
}: {
  month: IsoDate;
  byDay: Map<IsoDate, ListSummary[]>;
  today: IsoDate;
  selected: IsoDate | null;
  onDay: (day: IsoDate) => void;
}) {
  const t = useT('calendar');
  const f = useFormat();
  const prefix = month.slice(0, 7);
  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5">
      <div className="grid grid-cols-7 border-b border-ink/10 text-center text-xs text-ink/60 dark:border-paper/10 dark:text-paper/60">
        {f.weekdays.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthGrid(month)
          .flat()
          .map((day) => {
            const lists = byDay.get(day) ?? [];
            const inMonth = day.startsWith(prefix);
            return (
              <div
                key={day}
                onClick={(e) => {
                  // The cell's empty space picks the day too; a list chip opens its list.
                  if (!(e.target as HTMLElement).closest('a,button')) onDay(day);
                }}
                className={cn(
                  'min-h-16 cursor-pointer border-r border-b border-ink/5 p-1 sm:min-h-20 dark:border-paper/5',
                  !inMonth && 'bg-ink/[0.02] text-ink/30 dark:bg-paper/[0.02] dark:text-paper/30',
                  selected === day && 'bg-quake/10 ring-2 ring-quake ring-inset',
                )}
              >
                <button
                  type="button"
                  onClick={() => onDay(day)}
                  aria-pressed={selected === day}
                  aria-label={f.day(day)}
                  className={cn(
                    'mb-1 rounded px-1 text-xs hover:bg-quake/20',
                    day === today &&
                      'inline-flex size-5 items-center justify-center rounded-full bg-quake font-semibold text-white',
                  )}
                >
                  {Number(day.slice(8))}
                </button>
                <div className="space-y-0.5">
                  {lists.slice(0, 3).map((l) => (
                    <ListChip key={l.id} list={l} compact />
                  ))}
                  {lists.length > 3 ? (
                    <p className="text-[11px] text-ink/60 dark:text-paper/60">
                      {t('more', { count: lists.length - 3 })}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function YearView({
  year,
  byDay,
  today,
  selected,
  onDay,
  onPickMonth,
}: {
  year: string;
  byDay: Map<IsoDate, ListSummary[]>;
  today: IsoDate;
  selected: IsoDate | null;
  onDay: (day: IsoDate) => void;
  onPickMonth: (month: IsoDate) => void;
}) {
  const t = useT('calendar');
  const f = useFormat();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}-01`).map(
        (first) => {
          const prefix = first.slice(0, 7);
          const count = [...byDay.entries()]
            .filter(([d]) => d.startsWith(prefix))
            .reduce((n, [, l]) => n + l.length, 0);
          return (
            <div
              key={first}
              className="rounded-xl border border-ink/10 bg-white/70 p-2 text-left dark:border-paper/10 dark:bg-paper/5"
            >
              <button
                type="button"
                onClick={() => onPickMonth(first)}
                className="flex w-full items-baseline justify-between text-sm font-medium hover:text-quake"
              >
                {f.monthName(first)}
                <span className="text-xs font-normal text-ink/60 dark:text-paper/60">
                  {count ? t('lists', { count }) : ''}
                </span>
              </button>
              <span className="mt-1 grid grid-cols-7 gap-px">
                {monthGrid(first)
                  .flat()
                  .map((day) => {
                    const has = byDay.has(day);
                    const inMonth = day.startsWith(prefix);
                    return inMonth ? (
                      <button
                        key={day}
                        type="button"
                        onClick={() => onDay(day)}
                        aria-pressed={selected === day}
                        aria-label={f.day(day)}
                        className={cn(
                          'flex aspect-square items-center justify-center rounded-sm text-[9px]',
                          has
                            ? 'bg-quake text-white'
                            : 'text-ink/50 hover:bg-ink/10 dark:text-paper/50',
                          day === today && 'ring-1 ring-ink dark:ring-paper',
                          selected === day && 'ring-2 ring-quake',
                        )}
                      >
                        {Number(day.slice(8))}
                      </button>
                    ) : (
                      <span key={day} />
                    );
                  })}
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}

/** The lists of the selected day, or of everything in the period shown, by day. */
function DayList({
  byDay,
  selected,
  inPeriod,
  title,
  onClear,
}: {
  byDay: Map<IsoDate, ListSummary[]>;
  selected: IsoDate | null;
  inPeriod: (day: IsoDate) => boolean;
  title: string;
  onClear: (() => void) | null;
}) {
  const t = useT('calendar');
  const f = useFormat();
  const days = [...byDay.entries()]
    .filter(([d]) => (selected ? d === selected : inPeriod(d)))
    .sort(([a], [b]) => a.localeCompare(b));
  return (
    <section aria-live="polite" className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-ink/70 underline hover:text-quake dark:text-paper/70"
          >
            {t('showAll')}
          </button>
        ) : null}
      </div>
      {days.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">
          {selected ? t('emptyDay') : t('emptyPeriod')}
        </p>
      ) : (
        <ul className="space-y-1">
          {days.flatMap(([day, lists]) =>
            lists.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/lists/${l.id}`}
                  className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-ink/5 dark:hover:bg-paper/10"
                >
                  <span className="min-w-0 truncate">
                    {selected ? null : (
                      <span className="mr-2 text-xs text-ink/60 dark:text-paper/60">
                        {f.day(day, 'short')}
                      </span>
                    )}
                    <span className="font-medium">{l.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink/60 tabular-nums dark:text-paper/60">
                    {t('toBuy', { open: l.open, total: f.money(l.total, l.currency) })}
                  </span>
                </Link>
              </li>
            )),
          )}
        </ul>
      )}
    </section>
  );
}
