import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from './i18n';
/**
 * Dates and times for people: always in the viewer's own time zone (the host passes it as
 * `timeZone`: `getTimeZone()` on the root domain, `ctx.timeZone` in apps; ADR 0010). Pure and
 * safe on the server and in the browser. Never format a timestamp with a fixed "UTC".
 */

export const DEFAULT_TIME_ZONE = 'UTC';

/** A valid IANA time zone such as "Europe/Bucharest"? */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export type DateTimeStyle = 'datetime' | 'date' | 'long-date' | 'time';

const OPTIONS: Record<DateTimeStyle, Intl.DateTimeFormatOptions> = {
  // "24 Sept 2026, 14:03 EEST"
  datetime: {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  },
  // "24 Sept 2026"
  date: { day: 'numeric', month: 'short', year: 'numeric' },
  // "24 September 2026"
  'long-date': { day: 'numeric', month: 'long', year: 'numeric' },
  // "14:03 EEST"
  time: { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' },
};

/** Formats a timestamp in `timeZone`; "—" for no value. Unknown zones fall back to UTC. */
export function formatDateTime(
  value: Date | string | number | null | undefined,
  timeZone: string,
  style: DateTimeStyle = 'datetime',
  /** Page language (ADR 0011); dates are written the way its readers expect. */
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (value === null || value === undefined || value === '') return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const zone = isTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { ...OPTIONS[style], timeZone: zone }).format(
    date,
  );
}

/** Minutes the zone is ahead of UTC at `at` (e.g. 180 for Bucharest in summer). */
export function utcOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const zone = isTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

/** "+03:00" for MySQL CONVERT_TZ (numeric offsets work without the time-zone tables). */
export function sqlOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/**
 * A date and time a person typed (e.g. "2026-09-24T14:30" from <input type="datetime-local">)
 * in their own time zone, as the UTC instant to store. The database only ever holds UTC.
 * Returns null for anything that is not a valid local date-time.
 */
export function localDateTimeToUtc(local: string, timeZone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local.trim());
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((v) => Number(v ?? 0)) as number[];
  const wall = Date.UTC(y!, mo! - 1, d!, h!, mi!, s ?? 0);
  const check = new Date(wall);
  if (check.getUTCMonth() !== mo! - 1 || check.getUTCDate() !== d!) return null;
  // The zone's offset at that moment (twice: the first guess can sit across a DST change).
  let utc = wall - utcOffsetMinutes(timeZone, new Date(wall)) * 60000;
  utc = wall - utcOffsetMinutes(timeZone, new Date(utc)) * 60000;
  return new Date(utc);
}
