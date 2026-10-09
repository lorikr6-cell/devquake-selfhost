import { BULL, isDart, type Dart } from './darts';

// The games the app knows, their options and where they can be played. Pure.

export const MODES = ['practice', 'casual', 'tournament'] as const;
export type Mode = (typeof MODES)[number];

export const GAME_TYPES = [
  'x01',
  'cricket',
  'shanghai',
  'atc',
  'killer',
  'countup',
  'targets',
  'checkout',
] as const;
export type GameType = (typeof GAME_TYPES)[number];

/** Games offered in each mode (drills only in practice; Killer needs opponents). */
export const GAMES_BY_MODE: Record<Mode, readonly GameType[]> = {
  practice: ['x01', 'cricket', 'shanghai', 'atc', 'countup', 'targets', 'checkout'],
  casual: ['x01', 'cricket', 'shanghai', 'atc', 'killer', 'countup'],
  tournament: ['x01', 'cricket', 'shanghai', 'atc', 'countup'],
};

/** Players in a casual game (the owner included). Practice is always alone; tournaments 1-on-1. */
export const PLAYER_LIMITS: Record<GameType, { min: number; max: number }> = {
  x01: { min: 2, max: 4 },
  cricket: { min: 2, max: 4 },
  shanghai: { min: 2, max: 4 },
  atc: { min: 2, max: 4 },
  killer: { min: 2, max: 8 },
  countup: { min: 2, max: 4 },
  targets: { min: 1, max: 1 },
  checkout: { min: 1, max: 1 },
};

export const X01_STARTS = [301, 501, 701, 1001] as const;
export type InMode = 'straight' | 'double';
export type OutMode = 'double' | 'single' | 'master';

export interface X01Options {
  start: number;
  in: InMode;
  out: OutMode;
  /** First to this many legs. */
  legs: number;
}
export interface CricketOptions {
  variant: 'standard' | 'cutthroat';
  legs: number;
}
export interface ShanghaiOptions {
  rounds: 7 | 20;
}
export interface AtcOptions {
  /** 'any': any part of the number counts; 'doubles': only its double (the inner bull last). */
  hit: 'any' | 'doubles';
}
export interface KillerOptions {
  lives: number;
}
export interface CountupOptions {
  rounds: number;
}
/** A target on a drill: multiplier 0 means any part of the number (or any bull). */
export interface DrillTarget {
  n: number;
  m: 0 | 1 | 2 | 3;
}
export interface TargetsOptions {
  targets: DrillTarget[];
  dartsPerTarget: number;
}
export interface CheckoutOptions {
  finishes: number[];
  dartsPerFinish: number;
}

export interface OptionsByType {
  x01: X01Options;
  cricket: CricketOptions;
  shanghai: ShanghaiOptions;
  atc: AtcOptions;
  killer: KillerOptions;
  countup: CountupOptions;
  targets: TargetsOptions;
  checkout: CheckoutOptions;
}
export type GameOptions = OptionsByType[GameType];

export const DEFAULT_OPTIONS: OptionsByType = {
  x01: { start: 501, in: 'straight', out: 'double', legs: 1 },
  cricket: { variant: 'standard', legs: 1 },
  shanghai: { rounds: 7 },
  atc: { hit: 'any' },
  killer: { lives: 3 },
  countup: { rounds: 8 },
  targets: {
    targets: [
      { n: 20, m: 2 },
      { n: 16, m: 2 },
      { n: 8, m: 2 },
    ],
    dartsPerTarget: 9,
  },
  checkout: { finishes: [40, 60, 81, 100], dartsPerFinish: 9 },
};

export const MAX_LEGS = 5;
export const KILLER_LIVES = [3, 5] as const;
export const COUNTUP_ROUNDS = [8, 10, 20] as const;
export const DRILL_DARTS = [3, 6, 9, 15] as const;
export const MAX_DRILL_TARGETS = 10;

export function isGameType(value: unknown): value is GameType {
  return typeof value === 'string' && (GAME_TYPES as readonly string[]).includes(value);
}
export function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && (MODES as readonly string[]).includes(value);
}

const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;
const int = (value: unknown, min: number, max: number, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : fallback;
};

function isDrillTarget(value: unknown): value is DrillTarget {
  if (!value || typeof value !== 'object') return false;
  const { n, m } = value as Record<string, unknown>;
  if (m === 0) return typeof n === 'number' && ((n >= 1 && n <= 20) || n === BULL);
  return isDart({ n, m }) && n !== 0;
}

/**
 * The options of a game from untrusted input: anything missing or invalid takes the default,
 * so a stored game can always be replayed. Throws only for drills without a usable target.
 */
export function normalizeOptions<T extends GameType>(type: T, raw: unknown): OptionsByType[T] {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_OPTIONS;
  const byType: { [K in GameType]: () => OptionsByType[K] } = {
    x01: () => ({
      // The screens offer X01_STARTS; any start replays (tests, custom games).
      start: int(o.start, 2, 1001, d.x01.start),
      in: pick(o.in, ['straight', 'double'] as const, d.x01.in),
      out: pick(o.out, ['double', 'single', 'master'] as const, d.x01.out),
      legs: int(o.legs, 1, MAX_LEGS, 1),
    }),
    cricket: () => ({
      variant: pick(o.variant, ['standard', 'cutthroat'] as const, d.cricket.variant),
      legs: int(o.legs, 1, MAX_LEGS, 1),
    }),
    shanghai: () => ({ rounds: pick(Number(o.rounds), [7, 20] as const, 7) }),
    atc: () => ({ hit: pick(o.hit, ['any', 'doubles'] as const, 'any') }),
    killer: () => ({ lives: pick(Number(o.lives), KILLER_LIVES, 3) }),
    countup: () => ({ rounds: pick(Number(o.rounds), COUNTUP_ROUNDS, 8) }),
    targets: () => {
      const targets = Array.isArray(o.targets)
        ? o.targets.filter(isDrillTarget).slice(0, MAX_DRILL_TARGETS)
        : [];
      return {
        targets: targets.length ? targets : d.targets.targets,
        dartsPerTarget: pick(Number(o.dartsPerTarget), DRILL_DARTS, 9),
      };
    },
    checkout: () => {
      const finishes = Array.isArray(o.finishes)
        ? o.finishes
            .map(Number)
            .filter((f) => Number.isInteger(f) && f >= 2 && f <= 170)
            .slice(0, MAX_DRILL_TARGETS)
        : [];
      return {
        finishes: finishes.length ? finishes : d.checkout.finishes,
        dartsPerFinish: pick(Number(o.dartsPerFinish), DRILL_DARTS, 9),
      };
    },
  };
  return byType[type]() as OptionsByType[T];
}

/** Whether a drill target was hit by a dart. */
export function hitsTarget(t: DrillTarget, d: Dart): boolean {
  if (d.n !== t.n) return false;
  return t.m === 0 || d.m === t.m;
}

/** Games decided by legs (the others are one game). */
export const hasLegs = (type: GameType) => type === 'x01' || type === 'cricket';
