import { BULL } from './engine/darts';

// Plain data shared by the screens and the server (no database, no React).

export const HANDS = ['right', 'left'] as const;
export type Hand = (typeof HANDS)[number];

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

/** How scores are entered: tapping the dartboard, or a keypad per dart with +/−. */
export const ENTRY_MODES = ['board', 'keypad'] as const;
export type EntryMode = (typeof ENTRY_MODES)[number];

export const CURRENCIES = ['EUR', 'RON', 'HUF', 'USD', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Doubles a player can choose as their favourite (1–20 and the bull). */
export const FAVORITE_DOUBLES = [...Array.from({ length: 20 }, (_, i) => 20 - i), BULL];

export interface Profile {
  nickname: string;
  hand: Hand;
  level: Level;
  entryMode: EntryMode;
  favoriteDouble: number | null;
}

/** Join, board and watch codes: 8 characters without look-alikes (0/O, 1/I). */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;
export const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

export function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  // 256 is a multiple of 32: every character is equally likely.
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/** "ab c-d 12" → "ABCD12": what people type or read out, tidied. */
export function cleanCode(value: unknown): string {
  return typeof value === 'string' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
}

export const GAME_STATUSES = ['waiting', 'playing', 'finished'] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const TOURNAMENT_STATUSES = ['registration', 'running', 'finished'] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

/** How often the screens ask whether a game or tournament changed. */
export const GAME_POLL_MS = 2000;
export const TOURNAMENT_POLL_MS = 5000;

/** Money in cents shown in the page language ("12,50 €"). */
export function formatMoney(cents: number, currency: string, localeTag: string): string {
  return new Intl.NumberFormat(localeTag, { style: 'currency', currency }).format(cents / 100);
}
