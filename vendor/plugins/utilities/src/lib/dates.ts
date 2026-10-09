// Calendar days ("YYYY-MM-DD") and billing months ("YYYY-MM") as strings: no time, no time zone
// (ADR 0010: DATE columns are shown as stored). Pure, used by pages, the API and tests.

export type IsoDate = string;
export type IsoMonth = string;

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in an IANA time zone ("en-CA" formats as YYYY-MM-DD); invalid zones → UTC. */
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

export function isIsoMonth(value: unknown): value is IsoMonth {
  return (
    typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && isIsoDate(`${value}-01`)
  );
}

/** The month plus `months` ("2026-01", -1 → "2025-12"). */
export function addMonths(month: IsoMonth, months: number): IsoMonth {
  const [y, m] = month.split('-').map(Number);
  const index = y! * 12 + (m! - 1) + months;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
}

/** The twelve months of a year. */
export function monthsOf(year: number): IsoMonth[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${pad(i + 1)}`);
}

/** Noon UTC on the first of the month, for formatting only. */
function monthDate(month: IsoMonth): Date {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, 1, 12));
}

// The formatters take the page language's BCP 47 tag (LOCALE_TAGS in @devquake/ui).

export function formatMonth(month: IsoMonth, tag = 'en-GB'): string {
  return monthDate(month).toLocaleDateString(tag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatMonthShort(month: IsoMonth, tag = 'en-GB'): string {
  return monthDate(month).toLocaleDateString(tag, { month: 'short', timeZone: 'UTC' });
}

export function formatDay(day: IsoDate, tag = 'en-GB'): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 12)).toLocaleDateString(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
