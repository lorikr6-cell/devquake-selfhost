// Copying shopping lists to other days (the "Copy lists" form in the New tab). Pure: which list
// goes to which day. Unit-tested (replicate.test.ts).

import { addDays, startOfWeek, weekDays, type IsoDate } from './dates';

/** At most this many lists are created by one copy. */
export const MAX_COPIES = 200;

export type ListScope = 'day' | 'week' | 'month';

const pad = (n: number) => String(n).padStart(2, '0');
const lastDayOf = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Every day of the month of `date`. */
export function monthDays(date: IsoDate): IsoDate[] {
  const [y, m] = date.split('-').map(Number) as [number, number];
  return Array.from({ length: lastDayOf(y, m) }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
}

/**
 * One list copied: to `date` ("day"), to every day of its week ("week", Monday to Sunday) or to
 * every day of its month ("month"). The source list's own day is left out.
 */
export function listTargets(sourceDate: IsoDate, scope: ListScope, date: IsoDate): IsoDate[] {
  const days = scope === 'day' ? [date] : scope === 'week' ? weekDays(date) : monthDays(date);
  return days.filter((d) => d !== sourceDate);
}

export interface Copy {
  listId: number;
  date: IsoDate;
}

/**
 * A week's lists (the week of `date`) copied to the same weekday of every other week that starts
 * in the same month; a day that falls outside that month is left out.
 */
export function weekToMonth(lists: { id: number; shopDate: IsoDate }[], date: IsoDate): Copy[] {
  const monday = startOfWeek(date);
  const month = monday.slice(0, 7);
  const week = weekDays(monday);
  const source = lists.filter((l) => week.includes(l.shopDate));
  const mondays: IsoDate[] = [];
  for (let d = startOfWeek(`${month}-01`); d.slice(0, 7) <= month; d = addDays(d, 7)) {
    if (d !== monday) mondays.push(d);
  }
  const copies: Copy[] = [];
  for (const target of mondays) {
    for (const list of source) {
      const offset = week.indexOf(list.shopDate);
      const day = addDays(target, offset);
      if (day.slice(0, 7) === month) copies.push({ listId: list.id, date: day });
    }
  }
  return copies;
}

/**
 * A month's lists copied to every other month of the same year, on the same day of the month
 * (the last day when that month is shorter: the 31st → 30 April).
 */
export function monthToYear(lists: { id: number; shopDate: IsoDate }[], month: string): Copy[] {
  const [year, from] = month.split('-').map(Number) as [number, number];
  const source = lists.filter((l) => l.shopDate.slice(0, 7) === month);
  const copies: Copy[] = [];
  for (let m = 1; m <= 12; m++) {
    if (m === from) continue;
    for (const list of source) {
      const day = Math.min(Number(list.shopDate.slice(8, 10)), lastDayOf(year, m));
      copies.push({ listId: list.id, date: `${year}-${pad(m)}-${pad(day)}` });
    }
  }
  return copies;
}
