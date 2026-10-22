import { describe, expect, it } from 'vitest';
import { birthdayIn, isMonth, monthGrid, shiftMonth } from './calendar';

describe('calendar', () => {
  it('pads the month to whole weeks from Monday', () => {
    // October 2026 starts on a Thursday and has 31 days.
    const grid = monthGrid('2026-10');
    expect(grid.slice(0, 4)).toEqual([null, null, null, '2026-10-01']);
    expect(grid.length % 7).toBe(0);
    expect(grid.filter(Boolean)).toHaveLength(31);
  });

  it('moves between months across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('checks months', () => {
    expect(isMonth('2026-10')).toBe(true);
    expect(isMonth('2026-13')).toBe(false);
    expect(isMonth('1999-01')).toBe(false);
  });

  it('celebrates 29 February on 28 February in other years', () => {
    expect(birthdayIn('1944-02-29', 2027)).toBe('2027-02-28');
    expect(birthdayIn('1944-02-29', 2028)).toBe('2028-02-29');
    expect(birthdayIn('1957-09-17', 2026)).toBe('2026-09-17');
  });
});
