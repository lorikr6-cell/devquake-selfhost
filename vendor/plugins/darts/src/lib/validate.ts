import { isDart, parseDart, type Dart } from './engine/darts';
import {
  GAMES_BY_MODE,
  isGameType,
  normalizeOptions,
  type GameOptions,
  type GameType,
  type Mode,
} from './engine/games';
import { HttpError } from './http';
import {
  CURRENCIES,
  ENTRY_MODES,
  FAVORITE_DOUBLES,
  HANDS,
  LEVELS,
  type Currency,
  type Profile,
} from './model';
import { MAX_BOARDS } from './tournament';

/** Input validation for the API: every function throws HttpError(400) with a translation key. */

export type Body = Record<string, unknown>;

export async function readBody(request: Request): Promise<Body> {
  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'invalidRequest');
  }
  return data as Body;
}

const bad = (key: string, params?: Record<string, string | number>) =>
  new HttpError(400, key, params);

export function text(value: unknown, field: string, max: number, min = 1): string {
  if (typeof value !== 'string') throw bad('required', { field });
  const t = value.replace(/\s+/g, ' ').trim();
  if (!t) throw bad('required', { field });
  if (t.length < min) throw bad('tooShort', { field, min });
  if (t.length > max) throw bad('tooLong', { field, max });
  return t;
}

export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value))
    return value as T;
  throw bad('invalidRequest');
}

export function profile(body: Body): Profile {
  const fav = body.favoriteDouble;
  const favoriteDouble = fav === null || fav === undefined || fav === '' ? null : Number(fav);
  if (favoriteDouble !== null && !FAVORITE_DOUBLES.includes(favoriteDouble)) {
    throw bad('invalidRequest');
  }
  return {
    nickname: text(body.nickname, 'nickname', 40, 2),
    hand: oneOf(body.hand, HANDS),
    level: oneOf(body.level, LEVELS),
    entryMode: oneOf(body.entryMode, ENTRY_MODES),
    favoriteDouble,
  };
}

/** A game type allowed in `mode`, with its options tidied (defaults for anything missing). */
export function gameChoice(body: Body, mode: Mode): { type: GameType; options: GameOptions } {
  if (!isGameType(body.type) || !GAMES_BY_MODE[mode].includes(body.type)) {
    throw bad('gameType');
  }
  return { type: body.type, options: normalizeOptions(body.type, body.options) };
}

/** Up to three darts, as objects ({ n, m }) or labels ("T20"). */
export function darts(value: unknown): Dart[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 3) throw bad('threeDarts');
  return value.map((raw) => {
    const d = typeof raw === 'string' ? parseDart(raw) : raw;
    if (!isDart(d)) throw bad('invalidDart');
    return { n: d.n, m: d.m };
  });
}

/** A number of cents from a decimal amount ("12.5" → 1250), 0 to 1 000 000. */
export function money(value: unknown): number {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (n === undefined || n === null || n === '') return 0;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 10000) throw bad('fee');
  return Math.round(n * 100);
}

export function percent(value: unknown): number {
  const n = Number(value ?? 0);
  if (!Number.isInteger(n) || n < 0 || n > 100) throw bad('percent');
  return n;
}

export function currency(value: unknown): Currency {
  return oneOf(value, CURRENCIES);
}

export function boardCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_BOARDS) throw bad('boards', { max: MAX_BOARDS });
  return n;
}
