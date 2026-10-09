import { describe, expect, it } from 'vitest';
import { listTargets, monthDays, monthToYear, weekToMonth } from './replicate';

describe('copying lists', () => {
  it('copies one list to a day, a week or a month, not onto itself', () => {
    expect(listTargets('2026-09-07', 'day', '2026-09-14')).toEqual(['2026-09-14']);
    // Week of Wednesday 16 September 2026: Monday 14 to Sunday 20.
    expect(listTargets('2026-09-07', 'week', '2026-09-16')).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ]);
    const month = listTargets('2026-09-07', 'month', '2026-09-01');
    expect(month).toHaveLength(29);
    expect(month).not.toContain('2026-09-07');
    expect(monthDays('2028-02-10')).toHaveLength(29);
  });

  it('copies a week to the other weeks of its month, keeping the weekdays', () => {
    const lists = [
      { id: 1, shopDate: '2026-09-07' }, // Monday
      { id: 2, shopDate: '2026-09-12' }, // Saturday
      { id: 3, shopDate: '2026-09-21' }, // another week: not copied
    ];
    const copies = weekToMonth(lists, '2026-09-09');
    // Weeks starting 31 Aug (only its September days), 14, 21 and 28 September.
    expect(copies).toEqual([
      { listId: 2, date: '2026-09-05' },
      { listId: 1, date: '2026-09-14' },
      { listId: 2, date: '2026-09-19' },
      { listId: 1, date: '2026-09-21' },
      { listId: 2, date: '2026-09-26' },
      { listId: 1, date: '2026-09-28' },
    ]);
  });

  it('copies a month to the other months of the year, shortening the 31st', () => {
    const copies = monthToYear([{ id: 5, shopDate: '2026-01-31' }], '2026-01');
    expect(copies).toHaveLength(11);
    expect(copies[0]).toEqual({ listId: 5, date: '2026-02-28' });
    expect(copies.find((c) => c.date.startsWith('2026-04'))?.date).toBe('2026-04-30');
    expect(copies.at(-1)).toEqual({ listId: 5, date: '2026-12-31' });
  });
});
