// Calendar days ("YYYY-MM-DD") as strings: no time, no time zone (ADR 0010: DATE columns are
// shown as stored). Pure; used by pages, the API and tests.

export type IsoDate = string;

const pad = (n: number) => String(n).padStart(2, '0');
const DAY_MS = 86_400_000;

/** The day of `now` in an IANA time zone ("en-CA" formats as YYYY-MM-DD); invalid zones → UTC. */
export function todayIn(timeZone: string | undefined, now: Date = new Date()): IsoDate {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || 'UTC' }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(now);
  }
}

/** True for a real calendar day between 2000 and 2100, e.g. rejects 2026-02-30. */
export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return date.getUTCDate() === d && date.getUTCMonth() === m! - 1 && y! >= 2000 && y! <= 2100;
}

function utcNoon(day: IsoDate): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!, 12);
}

function fromUtc(ms: number): IsoDate {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The day plus `days` ("2026-12-31", 1 → "2027-01-01"). */
export function addDays(day: IsoDate, days: number): IsoDate {
  return fromUtc(utcNoon(day) + days * DAY_MS);
}

/** Whole days from `a` to `b` (negative when b is earlier). */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  return Math.round((utcNoon(b) - utcNoon(a)) / DAY_MS);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayOf(day: IsoDate): number {
  return (new Date(utcNoon(day)).getUTCDay() + 6) % 7;
}

/** The Monday of the day's week. */
export function mondayOf(day: IsoDate): IsoDate {
  return addDays(day, -weekdayOf(day));
}

/** The local wall time of an instant in `timeZone`, as "YYYY-MM-DDTHH:mm" (datetime-local). */
export function wallTime(at: Date, timeZone: string): string {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(at);
  } catch {
    return wallTime(at, 'UTC');
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

// The formatters take the page language's BCP 47 tag (LOCALE_TAGS in @devquake/ui).

/** "Mon, 5 Oct" */
export function formatDayShort(day: IsoDate, tag = 'en-GB'): string {
  return new Date(utcNoon(day)).toLocaleDateString(tag, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** "Monday, 5 October 2026" */
export function formatDayLong(day: IsoDate, tag = 'en-GB'): string {
  return new Date(utcNoon(day)).toLocaleDateString(tag, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** The short weekday names, Monday first ("Mon", "Tue", …). */
export function weekdayNames(tag = 'en-GB'): string[] {
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, 1 + i, 12)).toLocaleDateString(tag, {
      weekday: 'short',
      timeZone: 'UTC',
    }),
  );
}
