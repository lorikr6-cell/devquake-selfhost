import type { Diet, PersonKind, PersonStatus } from './model';

// Meal planning (docs/plugins/ideas/canteen.md, step 2): pure rules, tested in meals.test.ts.

/** The delivered meal of the day; residents' meals use their meal time's id. */
export const DELIVERY_MEAL = 0;

export const MAX_MEAL_TIMES = 6;
export const MAX_DISHES_LENGTH = 1000;

/** "08:30" → 510 minutes after midnight; null when it is not a time of day. */
export function parseTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** 510 → "08:30". */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  return `${String(h).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export interface MealTime {
  id: number;
  name: string;
  startsMin: number;
  endsMin: number;
}

/** Whether a meal time [start, end) overlaps another one of the list (except `exceptId`). */
export function overlaps(
  list: readonly MealTime[],
  start: number,
  end: number,
  exceptId?: number,
): MealTime | null {
  return list.find((m) => m.id !== exceptId && start < m.endsMin && m.startsMin < end) ?? null;
}

/** 1 = Monday … 7 = Sunday, for a YYYY-MM-DD day. */
export function weekdayOfDay(day: string): number {
  const d = new Date(`${day}T12:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

/** The menu lines, one dish per line, without empty ones. */
export function dishLines(dishes: string): string[] {
  return dishes
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Who eats, as the kitchen needs it: no address, no personal numbers. */
export interface Eater {
  id: number;
  firstName: string;
  lastName: string;
  kind: PersonKind;
  status: PersonStatus;
  diet: Diet;
  allergies: string | null;
  deliveryDays: number[];
}

export interface Portion {
  /** "Ana P." for the box label. */
  label: string;
  diet: Diet;
  allergies: string | null;
}

/**
 * The portions of one meal on `day`: the delivered meal goes to active people living at home on
 * their delivery days; every active resident has every meal time.
 */
export function portionsFor(eaters: readonly Eater[], day: string, meal: number): Portion[] {
  const weekday = weekdayOfDay(day);
  return eaters
    .filter((e) => e.status === 'active')
    .filter((e) =>
      meal === DELIVERY_MEAL
        ? e.kind === 'delivery' && e.deliveryDays.includes(weekday)
        : e.kind === 'resident',
    )
    .map((e) => ({
      label: `${e.firstName} ${e.lastName.charAt(0)}.`,
      diet: e.diet,
      allergies: e.allergies,
    }))
    .sort((a, b) => a.diet.localeCompare(b.diet) || a.label.localeCompare(b.label));
}

/** Portions per diet, only the diets that occur. */
export function countByDiet(portions: readonly Portion[]): Partial<Record<Diet, number>> {
  const counts: Partial<Record<Diet, number>> = {};
  for (const p of portions) counts[p.diet] = (counts[p.diet] ?? 0) + 1;
  return counts;
}
