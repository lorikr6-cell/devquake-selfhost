// Darts, segments and the board. Pure (no React, no server code): used by the engine, the
// server's validation and the browser's scoring screen.

/** 1 single, 2 double, 3 treble. The bull has a single (outer, 25) and a double (inner, 50). */
export type Multiplier = 1 | 2 | 3;

/** One dart: a number 1–20, 25 for the bull, or 0 for a miss (always multiplier 1). */
export interface Dart {
  n: number;
  m: Multiplier;
}

export const BULL = 25;
export const MISS: Dart = { n: 0, m: 1 };

/** Clockwise from the top. */
export const BOARD_ORDER = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

export function isDart(value: unknown): value is Dart {
  if (!value || typeof value !== 'object') return false;
  const { n, m } = value as Record<string, unknown>;
  if (typeof n !== 'number' || typeof m !== 'number' || !Number.isInteger(n)) return false;
  if (m !== 1 && m !== 2 && m !== 3) return false;
  if (n === 0) return m === 1;
  if (n === BULL) return m !== 3;
  return n >= 1 && n <= 20;
}

export function dartValue(d: Dart): number {
  return d.n * d.m;
}

export const isDouble = (d: Dart) => d.m === 2 && d.n > 0;
export const isTreble = (d: Dart) => d.m === 3;
export const isBull = (d: Dart) => d.n === BULL;

/** Short label: "T20", "D16", "5", "25", "BULL", "0". Not translated (darts notation). */
export function dartLabel(d: Dart): string {
  if (d.n === 0) return '0';
  if (d.n === BULL) return d.m === 2 ? 'BULL' : '25';
  if (d.m === 3) return `T${d.n}`;
  if (d.m === 2) return `D${d.n}`;
  return String(d.n);
}

/** The inverse of dartLabel (also "S5", "D25", "50", "MISS"); null when it is not a dart. */
export function parseDart(label: string): Dart | null {
  const s = label.trim().toUpperCase();
  if (s === '0' || s === 'MISS' || s === 'M') return { ...MISS };
  if (s === 'BULL' || s === 'DB' || s === '50' || s === 'D25') return { n: BULL, m: 2 };
  if (s === '25' || s === 'SB' || s === 'S25') return { n: BULL, m: 1 };
  const match = s.match(/^([SDT]?)(\d{1,2})$/);
  if (!match) return null;
  const m = (match[1] === 'T' ? 3 : match[1] === 'D' ? 2 : 1) as Multiplier;
  const dart = { n: Number(match[2]), m };
  return isDart(dart) ? dart : null;
}

export const sameDart = (a: Dart, b: Dart) => a.n === b.n && a.m === b.m;

/** Every dart that scores: singles, doubles, trebles 1–20, the outer and the inner bull. */
export const ALL_DARTS: readonly Dart[] = [
  ...[1, 2, 3].flatMap((m) =>
    Array.from({ length: 20 }, (_, i) => ({ n: i + 1, m: m as Multiplier })),
  ),
  { n: BULL, m: 1 },
  { n: BULL, m: 2 },
];

/** A stable key for a segment ("T20", "25", "0"): for counting where darts land. */
export const segmentKey = dartLabel;

/** Darts as stored and sent: "T20,1,D20". */
export const dartsToText = (darts: Dart[]) => darts.map(dartLabel).join(',');

/** The inverse of dartsToText (unreadable parts are skipped). */
export const textToDarts = (text: string): Dart[] =>
  text
    .split(',')
    .map((l) => parseDart(l))
    .filter((d): d is Dart => d !== null);
