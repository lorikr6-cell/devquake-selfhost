import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  formatMonth,
  formatMonthName,
  isIsoDate,
  monthGrid,
  startOfWeek,
  todayIn,
  toIsoDate,
  weekDays,
  weekdayNames,
} from './dates';

describe('dates', () => {
  it('validates real calendar days', () => {
    expect(isIsoDate('2026-09-24')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-9-24')).toBe(false);
    expect(isIsoDate('1999-12-31')).toBe(false);
    expect(isIsoDate(20260924)).toBe(false);
  });

  it('adds days and months across boundaries (incl. daylight saving)', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-25', -1)).toBe('2026-10-24');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01');
    expect(toIsoDate(new Date(2026, 8, 24, 23, 59))).toBe('2026-09-24');
  });

  it('starts weeks on Monday', () => {
    expect(startOfWeek('2026-09-24')).toBe('2026-09-21'); // Thursday → Monday
    expect(startOfWeek('2026-09-27')).toBe('2026-09-21'); // Sunday belongs to that week
    expect(weekDays('2026-09-21')).toHaveLength(7);
  });

  it('builds full Monday-to-Sunday weeks for a month', () => {
    const grid = monthGrid('2026-09-10');
    expect(grid[0]![0]).toBe('2026-08-31');
    expect(grid.at(-1)!.at(-1)).toBe('2026-10-04');
    expect(grid.flat()).toContain('2026-09-30');
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(monthGrid('2027-02-01')).toHaveLength(4); // Feb 2027 starts on a Monday
  });
});

describe('todayIn', () => {
  it('is the calendar day in the given zone', () => {
    const late = new Date('2026-09-24T22:30:00Z');
    expect(todayIn('Europe/Bucharest', late)).toBe('2026-09-25');
    expect(todayIn('UTC', late)).toBe('2026-09-24');
    expect(todayIn('America/New_York', late)).toBe('2026-09-24');
    expect(todayIn('Mars/Olympus', late)).toBe('2026-09-24');
    expect(todayIn(undefined, late)).toBe('2026-09-24');
  });
});

describe('formatting in the page language', () => {
  it('names weekdays and months in the given language, Monday first', () => {
    expect(weekdayNames()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(weekdayNames('de-DE')[0]).toMatch(/^Mo/);
    expect(formatMonthName('2026-09-01', 'ro-RO')).toBe('septembrie');
    expect(formatMonth('2026-09-01', 'hu-HU')).toContain('szeptember');
  });
});
