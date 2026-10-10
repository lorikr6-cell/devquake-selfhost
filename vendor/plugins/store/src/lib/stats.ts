// The shop's statistics (ADR 0058): periods, daily series with the empty days filled in, and
// rates. Pure and tested (stats.test.ts); the numbers come from orders and product_views.

export const PERIODS = [7, 30, 90, 365] as const;
export type Period = (typeof PERIODS)[number];

export function parsePeriod(value: unknown): Period {
  const n = Number(value);
  return (PERIODS as readonly number[]).includes(n) ? (n as Period) : 30;
}

/** The UTC days of a period ending today, oldest first ("2026-10-01"…). */
export function periodDays(days: number, now: Date): string[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, i) =>
    new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10),
  );
}

/** One value per day of `days`, 0 where nothing happened. */
export function fillDays<T extends { day: string }>(
  rows: T[],
  days: string[],
  value: (row: T) => number,
): number[] {
  const byDay = new Map<string, number>();
  for (const r of rows)
    byDay.set(r.day.slice(0, 10), (byDay.get(r.day.slice(0, 10)) ?? 0) + value(r));
  return days.map((d) => byDay.get(d) ?? 0);
}

/** Orders per 100 views, one decimal; null without views. */
export function conversionRate(orders: number, views: number): number | null {
  return views > 0 ? Math.round((orders / views) * 1000) / 10 : null;
}

/** The change from `before` to `now` in percent, rounded; null when there was nothing before. */
export function change(now: number, before: number): number | null {
  return before > 0 ? Math.round(((now - before) / before) * 100) : null;
}

/** Days of the period grouped for a readable chart: daily up to 31 days, else weekly. */
export function bucketSize(days: number): number {
  return days <= 31 ? 1 : 7;
}

export function bucket(values: number[], size: number): number[] {
  if (size <= 1) return values;
  const out: number[] = [];
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size).reduce((s, v) => s + v, 0));
  }
  return out;
}
