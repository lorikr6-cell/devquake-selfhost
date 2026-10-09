'use client';

import { useState } from 'react';
import { formatDateTime } from './datetime';
import type { Locale } from './i18n';
import { LOCALE_TAGS } from './i18n';

/** An event of a connected app (the shape of the SDK's LinkedCalendarEvent). */
export interface LinkedEventItem {
  app: string;
  appName: string;
  title: string;
  /** "YYYY-MM-DD" in the member's time zone. */
  day: string;
  startsAt: string | null;
  endsAt: string | null;
  url: string | null;
}

export interface LinkedEventsLabels {
  /** e.g. "From your other apps". */
  title: string;
  /** e.g. "The next 31 days of the apps you connected." */
  intro: string;
  allDay: string;
  /** "{app}" is replaced by the app's name. */
  openIn: string;
  month: string;
  allMonths: string;
  day: string;
  allDays: string;
  noEvents: string;
}

/**
 * Calendars across apps (ADR 0035): the events of the apps this app is connected to, day by
 * day, each opening in its app. Renders nothing without events.
 */
export function LinkedEvents({
  events,
  labels,
  timeZone,
  locale,
}: {
  events: LinkedEventItem[];
  labels: LinkedEventsLabels;
  timeZone: string;
  locale: Locale;
}) {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const months = [...new Set(events.map((event) => event.day.slice(0, 7)))].sort();
  const selectedMonth = months.includes(month) ? month : '';
  const days = [
    ...new Set(
      events
        .filter((event) => !selectedMonth || event.day.startsWith(selectedMonth))
        .map((event) => event.day),
    ),
  ].sort();
  const selectedDay = days.includes(day) ? day : '';
  const visibleEvents = events.filter((event) =>
    selectedDay ? event.day === selectedDay : !selectedMonth || event.day.startsWith(selectedMonth),
  );

  if (events.length === 0) return null;
  const dayName = (day: string) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${day}T12:00:00Z`));
  const monthName = (month: string) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${month}-01T12:00:00Z`));
  const visibleDays = [...new Set(visibleEvents.map((event) => event.day))];
  return (
    <section className="space-y-3 rounded-xl border border-ink/10 p-4 dark:border-paper/10">
      <div>
        <h2 className="font-display text-lg font-semibold">{labels.title}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{labels.intro}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-ink/70 dark:text-paper/70">
          {labels.month}
          <select
            value={selectedMonth}
            onChange={(event) => {
              setMonth(event.target.value);
              setDay('');
            }}
            className="min-h-10 rounded-md border border-ink/15 bg-white px-3 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            <option value="">{labels.allMonths}</option>
            {months.map((value) => (
              <option key={value} value={value}>
                {monthName(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-ink/70 dark:text-paper/70">
          {labels.day}
          <select
            value={selectedDay}
            onChange={(event) => setDay(event.target.value)}
            className="min-h-10 rounded-md border border-ink/15 bg-white px-3 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          >
            <option value="">{labels.allDays}</option>
            {days.map((value) => (
              <option key={value} value={value}>
                {dayName(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {visibleEvents.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{labels.noEvents}</p>
      ) : (
        <ol className="space-y-3">
          {visibleDays.map((day) => (
            <li key={day}>
              <h3 className="mb-1 text-sm font-semibold">
                <button
                  type="button"
                  aria-pressed={selectedDay === day}
                  onClick={() => setDay(selectedDay === day ? '' : day)}
                  className="text-ink/70 underline decoration-transparent underline-offset-2 hover:decoration-current dark:text-paper/70"
                >
                  {dayName(day)}
                </button>
              </h3>
              <ul className="divide-y divide-ink/10 dark:divide-paper/10">
                {visibleEvents
                  .filter((e) => e.day === day)
                  .map((e, i) => (
                    <LinkedEventRow
                      key={`${e.app}:${i}`}
                      event={e}
                      labels={labels}
                      timeZone={timeZone}
                      locale={locale}
                    />
                  ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** One event of a connected app: time, title, app and a link into it. */
export function LinkedEventRow({
  event,
  labels,
  timeZone,
  locale,
  className = 'flex flex-wrap items-start gap-3 py-2',
}: {
  event: LinkedEventItem;
  labels: Pick<LinkedEventsLabels, 'allDay' | 'openIn'>;
  timeZone: string;
  locale: Locale;
  className?: string;
}) {
  const time = event.startsAt
    ? `${formatDateTime(event.startsAt, timeZone, 'time', locale)}${
        event.endsAt ? ` – ${formatDateTime(event.endsAt, timeZone, 'time', locale)}` : ''
      }`
    : labels.allDay;
  return (
    <li className={className}>
      <p className="w-24 shrink-0 text-sm text-ink/70 dark:text-paper/70">{time}</p>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{event.title}</p>
        {event.url ? (
          <a href={event.url} className="text-xs font-medium text-quake underline">
            {labels.openIn.replace('{app}', event.appName)}
          </a>
        ) : (
          <p className="text-xs text-ink/60 dark:text-paper/60">{event.appName}</p>
        )}
      </div>
    </li>
  );
}
