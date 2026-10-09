import { ALL_DARTS, BOARD_ORDER, BULL, MISS, dartValue, isDouble, type Dart } from './darts';
import { DARTS_PER_VISIT, EngineError, playerOf, preview, type GameState } from './engine';
import type { X01Options } from './games';
import { checkoutRoutes, suggestions } from './suggest';

/**
 * One-click visits: whole visits (the darts still to throw) that are likely at this moment of
 * the game, so a player can enter what they threw with a single click. For X01: the finishes,
 * the player's own most frequent visits, then common totals made of the darts players usually
 * hit around the 20; for the other games, hits on the target that matters. Every pick is
 * replayed with the rules and must end the visit, so nothing impossible is offered. Pure.
 */

export type QuickKind = 'finish' | 'habit' | 'score' | 'target' | 'miss';

export interface QuickPick {
  kind: QuickKind;
  /** The darts still to throw in this visit. */
  darts: Dart[];
  /** Their total (what the button shows for scoring games). */
  total: number;
}

export const MAX_QUICK = 8;

/** Common visit totals, by darts left (the "bed" around the 20 and the big scores). */
const COMMON: Record<number, number[]> = {
  3: [60, 100, 140, 180, 45, 26, 41, 81, 85, 121, 0],
  2: [40, 60, 80, 120, 25, 21, 0],
  1: [20, 60, 5, 1, 40, 0],
};

/** How unusual a dart is when aiming at the 20: its neighbours are common, far numbers not. */
function dartCost(d: Dart): number {
  if (d.n === 0) return 0.5;
  if (d.n === BULL) return d.m === 2 ? 6 : 5;
  const i = BOARD_ORDER.indexOf(d.n as (typeof BOARD_ORDER)[number]);
  const away = Math.min(i, BOARD_ORDER.length - i); // segments from the 20
  return away * 1.2 + (d.m === 3 ? 1.5 : d.m === 2 ? 3 : 0);
}

const CANDIDATES: Dart[] = [MISS, ...ALL_DARTS];
let compositions: Map<string, Dart[]> | null = null;

/** The most likely darts that make `total` with `count` darts (null when impossible). */
export function compose(total: number, count: number): Dart[] | null {
  if (!compositions) {
    compositions = new Map();
    const best = new Map<string, number>();
    const visit = (from: number, darts: Dart[], cost: number) => {
      if (darts.length) {
        const key = `${darts.length}:${darts.reduce((s, d) => s + dartValue(d), 0)}`;
        if (cost < (best.get(key) ?? Infinity)) {
          best.set(key, cost);
          compositions!.set(
            key,
            [...darts].sort((a, b) => dartValue(b) - dartValue(a)),
          );
        }
      }
      if (darts.length === DARTS_PER_VISIT) return;
      for (let i = from; i < CANDIDATES.length; i++) {
        const d = CANDIDATES[i]!;
        visit(i, [...darts, d], cost + dartCost(d));
      }
    };
    visit(0, [], 0);
  }
  return compositions.get(`${count}:${total}`) ?? null;
}

const key = (darts: Dart[]) => darts.map((d) => `${d.n}x${d.m}`).join(',');

/**
 * Up to MAX_QUICK whole-visit picks for the player on turn of `base`, after `pending` darts of
 * this visit. `habits` are the player's frequent three-dart visits (most frequent first).
 */
export function quickPicks(
  base: GameState,
  pending: Dart[],
  habits: Dart[][] = [],
  favorite: number | null = null,
): QuickPick[] {
  let now: GameState;
  try {
    const p = preview(base, pending);
    if (p.over) return [];
    now = p.state;
  } catch (err) {
    if (err instanceof EngineError) return [];
    throw err;
  }
  const player = playerOf(now, now.current);
  if (!player) return [];
  const left = DARTS_PER_VISIT - pending.length;
  const picks: QuickPick[] = [];
  const seen = new Set<string>();

  /** Adds a pick if the rules accept it and it ends the visit. */
  const offer = (kind: QuickKind, darts: Dart[]) => {
    if (picks.length >= MAX_QUICK || darts.length === 0 || darts.length > left) return;
    const k = key(darts);
    if (seen.has(k)) return;
    try {
      const result = preview(base, [...pending, ...darts]);
      if (!result.over) return;
      // Busts are not offered: a single dart is quicker to enter for those.
      if (result.events.includes('bust')) return;
    } catch {
      return;
    }
    seen.add(k);
    picks.push({ kind, darts, total: darts.reduce((s, d) => s + dartValue(d), 0) });
  };
  const fill = (darts: Dart[]) => [
    ...darts,
    ...Array.from({ length: left - darts.length }, () => MISS),
  ];
  const misses = fill([]);

  if (now.type === 'x01' || now.type === 'checkout' || now.type === 'countup') {
    const score =
      now.type === 'x01' ? player.score : now.type === 'checkout' ? player.remaining : null;
    const out = now.type === 'x01' ? (now.options as X01Options).out : 'double';
    const opened = now.type !== 'x01' || player.opened;
    if (score !== null && opened) {
      for (const route of checkoutRoutes(score, left, out, favorite, 3)) offer('finish', route);
    }
    if (!opened) {
      for (const n of [20, 16, 10]) offer('score', fill([{ n, m: 2 }]));
    }
    if (pending.length === 0 && now.type !== 'checkout') {
      for (const h of habits) offer('habit', h);
    }
    for (const total of COMMON[left] ?? []) {
      const darts = compose(total, left);
      if (darts) offer(total === 0 ? 'miss' : 'score', darts);
    }
    return picks;
  }

  // Target games: hits on the targets that matter now (three, two, one), then all missed.
  const hints = suggestions(now, pending, favorite);
  if (now.type === 'shanghai' && hints[0]) {
    offer('target', hints[0].darts); // the Shanghai itself
  }
  if (now.type === 'atc' && hints[0]) {
    const seq = hints[0].darts;
    for (let hits = seq.length; hits >= 1; hits--) offer('target', fill(seq.slice(0, hits)));
  }
  for (const hint of hints.slice(0, 2)) {
    const target = hint.darts[0]!;
    const variants =
      isDouble(target) || target.n === BULL ? [target] : [target, { n: target.n, m: 1 as const }];
    for (const d of variants) {
      for (let hits = left; hits >= 1; hits--) {
        offer('target', fill(Array.from({ length: hits }, () => d)));
      }
    }
  }
  offer('miss', misses);
  return picks;
}
