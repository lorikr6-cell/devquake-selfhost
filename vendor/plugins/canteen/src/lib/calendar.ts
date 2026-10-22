// The month calendar (birthday badges): pure rules, tested in calendar.test.ts.

/** "2026-10" → the month's days, padded to whole weeks from Monday (null = outside the month). */
export function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y!, m! - 1, 1));
  const days = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday = 0
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) {
    cells.push(`${month}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export const isMonth = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) && Number(v.slice(0, 4)) >= 2000;

/** The month before or after ("2026-01", -1 → "2025-12"). */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * The day of `year` someone born on `birthDate` celebrates: 29 February falls on 28 February
 * in other years.
 */
export function birthdayIn(birthDate: string, year: number): string {
  const [, m, d] = birthDate.split('-').map(Number);
  const leap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
  const day = m === 2 && d === 29 && !leap ? 28 : d!;
  return `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
