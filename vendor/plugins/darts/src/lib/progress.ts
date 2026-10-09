import { dartLabel } from './engine/darts';
import type { EventKind, GameState } from './engine/engine';
import type { CheckoutOptions, GameType, KillerOptions, X01Options } from './engine/games';

/**
 * How a match went, visit by visit, for the progress chart and table: who threw what, in order,
 * and each player's score after it. Pure: built from a replayed game, on the server (tournament
 * page) and in the browser (game screen).
 */

export interface ProgressVisit {
  /** 1-based order in the match. */
  n: number;
  playerId: number;
  leg: number;
  round: number;
  /** "T20 20 1". */
  darts: string;
  total: number;
  /** What counted (X01: points taken off; 0 on a bust). */
  scored: number;
  /** The player's score after the visit, as the scoreboard shows it. */
  after: number;
  events: EventKind[];
}

export interface ProgressPlayer {
  id: number;
  /** Empty for a former player. */
  name: string;
  /** The score before the first visit (X01: the start score). */
  start: number;
}

export interface ProgressMatch {
  key: string;
  type: GameType;
  players: ProgressPlayer[];
  winnerId: number | null;
  visits: ProgressVisit[];
  /** Tournament matches: which round, on which board. */
  round?: number;
  board?: string | null;
}

/** The score every player starts with in this game. */
function startScore(state: GameState): number {
  if (state.type === 'x01') return (state.options as X01Options).start;
  if (state.type === 'checkout') return (state.options as CheckoutOptions).finishes[0] ?? 0;
  if (state.type === 'killer') return (state.options as KillerOptions).lives;
  return 0;
}

export function progressOf(state: GameState, key: string): ProgressMatch {
  const start = startScore(state);
  return {
    key,
    type: state.type,
    players: state.players.map((p) => ({ id: p.id, name: p.name, start })),
    winnerId: state.winner,
    visits: state.visits.map((v, i) => ({
      n: i + 1,
      playerId: v.playerId,
      leg: v.leg,
      round: v.round,
      darts: v.darts.map(dartLabel).join(' '),
      total: v.total,
      scored: v.scored,
      after: v.after,
      events: v.events,
    })),
  };
}

/** Names compared without case or accents ("ana" finds "Ána"). */
export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export function matchesName(name: string, query: string): boolean {
  const q = normalizeName(query);
  return q === '' || normalizeName(name).includes(q);
}

export interface PlayerSummary {
  visits: number;
  darts: number;
  /** Average of the darts' totals per three darts. */
  average: number | null;
  best: number;
  /** The highest score that finished a leg or the game (X01). */
  bestFinish: number | null;
  busts: number;
}

export function playerSummary(match: ProgressMatch, playerId: number): PlayerSummary {
  const mine = match.visits.filter((v) => v.playerId === playerId);
  const darts = mine.reduce((s, v) => s + v.darts.split(' ').length, 0);
  const finishes = mine
    .filter((v) => v.events.includes('leg') || v.events.includes('win'))
    .map((v) => v.scored);
  return {
    visits: mine.length,
    darts,
    average: darts ? (mine.reduce((s, v) => s + v.total, 0) / darts) * 3 : null,
    best: Math.max(0, ...mine.map((v) => v.total)),
    bestFinish: match.type === 'x01' && finishes.length ? Math.max(...finishes) : null,
    busts: mine.filter((v) => v.events.includes('bust')).length,
  };
}
