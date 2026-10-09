import type { PluginLinksApi } from './types';

/**
 * Calendars across apps (ADR 0035): an app with a calendar offers the link point
 * `calendar.events`; every calendar shows the events of the apps it is connected to.
 */

/** The link point every app with a calendar offers (read). */
export const CALENDAR_POINT = 'calendar.events';

/** Days per request at most (a calendar shows a month or two). */
export const CALENDAR_MAX_DAYS = 62;

/** Input of `calendar.events`. */
export interface CalendarFeedInput {
  /** "YYYY-MM-DD", inclusive, in the member's time zone. */
  from: string;
  to: string;
}

/** One event in a `calendar.events` reply. */
export interface CalendarFeedEvent {
  /** Unique within the app, e.g. "12:2026-10-05". */
  id: string;
  title: string;
  /** "YYYY-MM-DD" in the member's time zone. */
  day: string;
  /** Timed events: UTC ISO start (and end); null for all-day items. */
  startsAt: string | null;
  endsAt?: string | null;
  /** A deep-link target of the providing app and its parameters, to open the event there. */
  target?: string;
  params?: Record<string, string>;
}

/** An event of a connected app, ready to show in this app's calendar. */
export interface LinkedCalendarEvent {
  app: string;
  appName: string;
  title: string;
  day: string;
  startsAt: string | null;
  endsAt: string | null;
  /** Opens it in that app, with a way back here; null when it cannot be opened. */
  url: string | null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Valid range for `calendar.events` (handlers use it to check their input). */
export function calendarRange(input: unknown): CalendarFeedInput | null {
  const raw = (input ?? {}) as Record<string, unknown>;
  const from = raw.from;
  const to = raw.to;
  if (typeof from !== 'string' || typeof to !== 'string' || !DAY.test(from) || !DAY.test(to)) {
    return null;
  }
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  if (!Number.isFinite(days) || days < 0 || days > CALENDAR_MAX_DAYS) return null;
  return { from, to };
}

/**
 * The events of every connected app that offers `calendar.events`, from `from` to `to`, each
 * with a link into its app (and back to `returnTo` in this one). Empty without links.
 */
export async function linkedCalendarEvents(
  links: PluginLinksApi | undefined,
  range: CalendarFeedInput,
  returnTo: string,
): Promise<LinkedCalendarEvent[]> {
  if (!links) return [];
  const partners = (await links.list().catch(() => [])).filter((a) => a.state === 'connected');
  const out: LinkedCalendarEvent[] = [];
  for (const partner of partners) {
    const result = await links.call<{ events?: CalendarFeedEvent[] }>(
      partner.app,
      CALENDAR_POINT,
      range,
    );
    if (!result.ok || !Array.isArray(result.data?.events)) continue;
    for (const e of result.data.events.slice(0, 300)) {
      if (typeof e?.title !== 'string' || typeof e.day !== 'string' || !DAY.test(e.day)) continue;
      out.push({
        app: partner.app,
        appName: partner.name,
        title: e.title,
        day: e.day,
        startsAt: typeof e.startsAt === 'string' ? e.startsAt : null,
        endsAt: typeof e.endsAt === 'string' ? e.endsAt : null,
        url: e.target ? links.deepLink(partner.app, e.target, e.params ?? {}, { returnTo }) : null,
      });
    }
  }
  return out.sort(
    (a, b) => a.day.localeCompare(b.day) || (a.startsAt ?? '').localeCompare(b.startsAt ?? ''),
  );
}

/** `days` days from `today` ("YYYY-MM-DD"), today included: the range "the next 31 days". */
export function nextDays(today: string, days = 31): CalendarFeedInput {
  const to = new Date(Date.parse(`${today}T12:00:00Z`) + (days - 1) * 86_400_000);
  return { from: today, to: to.toISOString().slice(0, 10) };
}
