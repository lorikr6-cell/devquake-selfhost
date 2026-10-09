// API call counts and the call log (Pulse 0.3.0). Pure and tested.

/** How often the call log may be cleaned automatically: entries older than N days (0 = never). */
export const CLEANUP_DAYS = [0, 1, 7, 30, 90] as const;
export type CleanupDays = (typeof CLEANUP_DAYS)[number];

export function parseCleanupDays(value: unknown): CleanupDays | null {
  // Only numbers or numeric text: Number(null) and Number('') would read as 0 ("never").
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;
  const n = Number(value);
  return (CLEANUP_DAYS as readonly number[]).includes(n) ? (n as CleanupDays) : null;
}

/**
 * A count in short form: 950, 1.2K, 100K, 3.4M, 1.1B (in the page language's decimal mark).
 * One decimal below 10 of a unit, none above; never rounded up to the next unit's 1000.
 */
export function compactCount(n: number, localeTag: string): string {
  const value = Math.max(0, Math.floor(n));
  const units: Array<[number, string]> = [
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [size, suffix] of units) {
    if (value >= size) {
      const scaled = value / size;
      const digits = scaled < 10 ? 1 : 0;
      // Truncate (1,999 → 1.9K, not 2.0K) so the short form never claims more than there is.
      const factor = 10 ** digits;
      const cut = Math.floor(scaled * factor) / factor;
      return `${new Intl.NumberFormat(localeTag, { maximumFractionDigits: digits }).format(cut)}${suffix}`;
    }
  }
  return new Intl.NumberFormat(localeTag).format(value);
}

/** The developer API route of a request URL, e.g. "/v1/events" (for the log). */
export function apiRoute(url: string): string {
  const path = new URL(url).pathname;
  const i = path.indexOf('/v1/');
  return (i >= 0 ? path.slice(i) : path).slice(0, 40);
}
