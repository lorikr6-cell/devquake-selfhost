import { formatTime, parseTime } from './meals';

// The medical file (docs/plugins/ideas/canteen.md, step 4): pure rules, tested in medical.test.ts.

export const DOSE_STATUSES = ['given', 'refused', 'missed'] as const;
export type DoseStatus = (typeof DOSE_STATUSES)[number];
export const isDoseStatus = (v: unknown): v is DoseStatus =>
  DOSE_STATUSES.includes(v as DoseStatus);

export const MAX_TIMES_PER_DAY = 6;

/** "08:00, 20:00" → [480, 1200], sorted, each once; null when a part is not a time. */
export function parseTimes(value: unknown): number[] | null {
  if (typeof value !== 'string') return null;
  const parts = value
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > MAX_TIMES_PER_DAY) return null;
  const times = parts.map(parseTime);
  if (times.some((t) => t === null)) return null;
  return [...new Set(times as number[])].sort((a, b) => a - b);
}

export const timesText = (times: readonly number[]) => times.map(formatTime).join(', ');

export interface Schedule {
  id: number;
  times: number[];
  startsOn: string;
  endsOn: string | null;
}

/** Whether the medicine is given on `day` (its first and last day included). */
export function activeOn(m: Schedule, day: string): boolean {
  return m.startsOn <= day && (m.endsOn === null || day <= m.endsOn);
}

/** The doses due on `day`, in time order. */
export function dosesDue(
  medications: readonly Schedule[],
  day: string,
): { medicationId: number; timeMin: number }[] {
  return medications
    .filter((m) => activeOn(m, day))
    .flatMap((m) => m.times.map((timeMin) => ({ medicationId: m.id, timeMin })))
    .sort((a, b) => a.timeMin - b.timeMin || a.medicationId - b.medicationId);
}
