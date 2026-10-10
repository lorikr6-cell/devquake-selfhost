// Times are stored in UTC (ADR 0010); forms show and take them in the owner's time zone.

/**
 * A UTC time as a datetime-local field's value ("2026-11-27T00:00") in `timeZone`; '' for none.
 * The way back is localDateTimeToUtc from @devquake/ui (validate.ts).
 */
export function toLocalInput(value: string | null, timeZone: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
  } catch {
    return toLocalInput(value, 'UTC');
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
