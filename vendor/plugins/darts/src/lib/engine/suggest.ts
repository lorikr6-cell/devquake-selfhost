import {
  ALL_DARTS,
  BULL,
  dartValue,
  isDouble,
  isTreble,
  type Dart,
  type Multiplier,
} from './darts';
import {
  ATC_SEQUENCE,
  CRICKET_NUMBERS,
  DARTS_PER_VISIT,
  playerOf,
  shanghaiTarget,
  type GameState,
} from './engine';
import type {
  AtcOptions,
  CheckoutOptions,
  CricketOptions,
  OutMode,
  TargetsOptions,
  X01Options,
} from './games';

/**
 * Suggestions for the next darts: up to three routes that bring the player closest to winning.
 * X01 and the checkout drill: finishing routes from a checkout table computed on the fly (every
 * way to finish in the darts left, ranked the way players choose them), or a setup shot that
 * leaves a good double. Other games: the targets that matter most right now.
 */

export type SuggestionKind = 'checkout' | 'setup' | 'score' | 'open' | 'target';

export interface Suggestion {
  kind: SuggestionKind;
  darts: Dart[];
  /** The explanation shown with it: a translation key under suggest.explain. */
  why: string;
  /** Values for the explanation ({score}, {left}, {n}, {name}...). */
  params?: Record<string, string | number>;
  /** Any part of the number counts (single, double or treble), not just the one shown. */
  anyRing?: boolean;
  /** The darts can be thrown in any order (otherwise: in the order shown). */
  anyOrder?: boolean;
}

export const MAX_SUGGESTIONS = 3;

/** Doubles players prefer to finish on, best first (D20, D16, D8...). */
const PREFERRED_DOUBLES = [20, 16, 8, 18, 12, 10, 4, 14, 6, 2, 9, 17, 19, 15, 13, 11, 7, 5, 3, 1];
/** Numbers players prefer for trebles and singles (the top of the board first). */
const PREFERRED_NUMBERS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];

function finishes(d: Dart, out: OutMode): boolean {
  return out === 'single' || isDouble(d) || (out === 'master' && isTreble(d));
}

function doubleRank(d: Dart, favorite: number | null): number {
  if (favorite !== null && d.n === favorite) return -1;
  if (d.n === BULL) return PREFERRED_DOUBLES.length + 2;
  const i = PREFERRED_DOUBLES.indexOf(d.n);
  return i < 0 ? PREFERRED_DOUBLES.length : i;
}

/** How hard a dart that is not the finishing one is: singles are the easiest target. */
function setupCost(d: Dart): number {
  const numberRank = PREFERRED_NUMBERS.indexOf(d.n);
  const rank = numberRank < 0 ? PREFERRED_NUMBERS.length : numberRank;
  if (d.n === BULL) return d.m === 2 ? 9 : 7;
  if (d.m === 3) return 3 + rank * 0.2;
  if (d.m === 2) return 5;
  return rank * 0.1;
}

function routeCost(route: Dart[], favorite: number | null): number {
  const last = route[route.length - 1]!;
  const setup = route.slice(0, -1).reduce((sum, d) => sum + setupCost(d), 0);
  return route.length * 100 + doubleRank(last, favorite) * 3 + setup;
}

// Darts worth considering before the finishing one (the full list gives the same routes, slower).
const SETUP_DARTS: Dart[] = ALL_DARTS.filter((d) => d.m !== 2 || d.n === BULL);

const routeKey = (route: Dart[]) =>
  [
    ...route
      .slice(0, -1)
      .map((d) => d.n * 10 + d.m)
      .sort((a, b) => b - a),
    route[route.length - 1]!.n * 10 + route[route.length - 1]!.m,
  ].join('-');

/**
 * Every way to finish `score` with at most `dartsLeft` darts, cheapest first (fewest darts, the
 * preferred double, easy setup darts), without duplicates. `favorite` is the player's double.
 */
export function checkoutRoutes(
  score: number,
  dartsLeft: number,
  out: OutMode = 'double',
  favorite: number | null = null,
  limit = MAX_SUGGESTIONS,
): Dart[][] {
  if (score < 1 || score > 180 || dartsLeft < 1) return [];
  const enders = ALL_DARTS.filter((d) => finishes(d, out));
  const routes: Dart[][] = [];
  const seen = new Set<string>();
  const add = (route: Dart[]) => {
    const key = routeKey(route);
    if (seen.has(key)) return;
    seen.add(key);
    routes.push(route);
  };
  const ending = (rest: number) => enders.filter((d) => dartValue(d) === rest);
  const leftAfter = (rest: number) => rest > 1 || (out === 'single' && rest > 0);
  for (const e of ending(score)) add([e]);
  if (dartsLeft >= 2) {
    for (const a of SETUP_DARTS) {
      const rest = score - dartValue(a);
      if (!leftAfter(rest)) continue;
      for (const e of ending(rest)) add([a, e]);
    }
  }
  if (dartsLeft >= 3) {
    for (const a of SETUP_DARTS) {
      const r1 = score - dartValue(a);
      if (!leftAfter(r1)) continue;
      for (const b of SETUP_DARTS) {
        const r2 = r1 - dartValue(b);
        if (!leftAfter(r2)) continue;
        for (const e of ending(r2)) add(orderSetup([a, b], e));
      }
    }
  }
  return routes.sort((x, y) => routeCost(x, favorite) - routeCost(y, favorite)).slice(0, limit);
}

/** The higher setup dart first (T20 then 19, as players throw them). */
function orderSetup(setup: Dart[], end: Dart): Dart[] {
  return [...setup].sort((a, b) => dartValue(b) - dartValue(a)).concat(end);
}

/** The best finish anywhere between 2 and 170 can be done in three darts, except these. */
export const NO_CHECKOUT = [159, 162, 163, 165, 166, 168, 169] as const;

/**
 * When the score cannot be finished with the darts left: the darts that leave the best next
 * finish (a single preferred double, then any two-dart finish), or simply the most points.
 */
export function setupRoutes(
  score: number,
  dartsLeft: number,
  out: OutMode = 'double',
  favorite: number | null = null,
): Suggestion[] {
  if (dartsLeft < 1) return [];
  const t20: Dart = { n: 20, m: 3 };
  if (score - 60 * dartsLeft > 170) {
    return [
      {
        kind: 'score',
        darts: Array.from({ length: dartsLeft }, () => t20),
        why: 'far',
        params: { left: score },
      },
    ];
  }
  // One dart is enough to set up; more darts only add ways to miss.
  const candidates: { dart: Dart; cost: number; leave: number }[] = [];
  for (const dart of SETUP_DARTS) {
    const leave = score - dartValue(dart);
    if (leave < 2) continue;
    const next = checkoutRoutes(leave, DARTS_PER_VISIT, out, favorite, 1)[0];
    if (!next) continue;
    // Leaving one dart to finish (a double) is best, then two darts, then three.
    const cost = next.length * 100 + routeCost(next, favorite) * 0.1 + setupCost(dart) * 4;
    candidates.push({ dart, cost, leave });
  }
  candidates.sort((a, b) => a.cost - b.cost);
  return candidates.slice(0, MAX_SUGGESTIONS).map((c) => ({
    kind: 'setup',
    darts: [c.dart],
    why: 'setup',
    params: { left: c.leave },
  }));
}

/** Finishing routes, or setup shots when no finish is possible with the darts left. */
export function x01Suggestions(
  score: number,
  dartsLeft: number,
  out: OutMode,
  favorite: number | null = null,
): Suggestion[] {
  const routes = checkoutRoutes(score, dartsLeft, out, favorite);
  if (routes.length) {
    return routes.map((darts) => ({
      kind: 'checkout',
      darts,
      why: 'checkout',
      params: { score, count: darts.length },
    }));
  }
  return setupRoutes(score, dartsLeft, out, favorite);
}

const dart = (n: number, m: Multiplier): Dart => ({ n, m });

/**
 * Suggestions for the current player of `state`, where `state` already includes `pending`: the
 * darts of this visit thrown so far (not yet sent). `favorite` is the player's favourite double.
 */
export function suggestions(
  state: GameState,
  pending: Dart[] = [],
  favorite: number | null = null,
): Suggestion[] {
  const p = playerOf(state, state.current);
  if (!p || state.finished) return [];
  const dartsLeft = DARTS_PER_VISIT - pending.length;
  if (dartsLeft < 1) return [];
  switch (state.type) {
    case 'x01': {
      const o = state.options as X01Options;
      if (!p.opened) {
        return [20, 16, 10].map((n) => ({ kind: 'open', darts: [dart(n, 2)], why: 'doubleIn' }));
      }
      return x01Suggestions(p.score, dartsLeft, o.out, favorite);
    }
    case 'checkout':
      return x01Suggestions(p.remaining, dartsLeft, 'double', favorite);
    case 'cricket':
      return cricketSuggestions(state, p.id, state.options as CricketOptions);
    case 'shanghai': {
      const target = shanghaiTarget(state);
      if (target === BULL) {
        return [{ kind: 'target', darts: [dart(BULL, 2)], why: 'tiebreak', anyRing: true }];
      }
      // What is still missing for a Shanghai (single, double and treble) this visit.
      const hit = new Set(pending.filter((d) => d.n === target).map((d) => d.m));
      const missing = ([3, 2, 1] as Multiplier[]).filter((m) => !hit.has(m));
      return [
        {
          kind: 'target',
          darts: missing.map((m) => dart(target, m)),
          why: 'shanghai',
          params: { n: target },
          anyOrder: true,
        },
      ];
    }
    case 'atc': {
      const o = state.options as AtcOptions;
      const next = ATC_SEQUENCE.slice(p.step, p.step + dartsLeft);
      return [
        {
          kind: 'target',
          darts: next.map((n) => dart(n, o.hit === 'doubles' ? 2 : 1)),
          why: o.hit === 'doubles' ? 'sequenceDoubles' : 'sequence',
          params: { target: next[0]! },
          anyRing: o.hit !== 'doubles',
        },
      ];
    }
    case 'killer': {
      if (!p.killer) {
        return p.number
          ? [
              {
                kind: 'target',
                darts: [dart(p.number, 2)],
                why: 'becomeKiller',
                params: { n: p.number },
              },
            ]
          : [];
      }
      const victims = state.players
        .filter((q) => q.id !== p.id && !q.out && q.number)
        .sort((a, b) => a.score - b.score)
        .slice(0, MAX_SUGGESTIONS);
      return victims.map((q) => ({
        kind: 'target',
        darts: [dart(q.number!, 2)],
        why: q.score === 1 ? 'lastLife' : 'takeLife',
        params: { name: q.name, n: q.number!, lives: q.score },
      }));
    }
    case 'countup':
      return [
        { kind: 'score', darts: [dart(20, 3)], why: 'points', params: { points: 60 } },
        { kind: 'score', darts: [dart(19, 3)], why: 'points', params: { points: 57 } },
        { kind: 'score', darts: [dart(BULL, 2)], why: 'points', params: { points: 50 } },
      ];
    case 'targets': {
      const target = (state.options as TargetsOptions).targets[p.step];
      if (!target) return [];
      return [
        {
          kind: 'target',
          darts: [dart(target.n, (target.m || 1) as Multiplier)],
          why: 'drill',
          anyRing: target.m === 0,
        },
      ];
    }
  }
}

function cricketSuggestions(state: GameState, playerId: number, o: CricketOptions): Suggestion[] {
  const p = playerOf(state, playerId)!;
  const rivals = state.players.filter((q) => q.id !== playerId && !q.out);
  const mine = (n: number) => p.marks[n] ?? 0;
  const closedByAll = (n: number) => rivals.every((q) => (q.marks[n] ?? 0) >= 3);
  const out: Suggestion[] = [];
  const add = (n: number, why: string) => {
    if (out.length >= MAX_SUGGESTIONS || out.some((s) => s.darts[0]!.n === n)) return;
    out.push({ kind: 'target', darts: [dart(n, n === BULL ? 2 : 3)], why, params: { n } });
  };
  // 1. Close numbers a rival is scoring on (they closed it, you have not).
  for (const n of CRICKET_NUMBERS) {
    if (mine(n) < 3 && rivals.some((q) => (q.marks[n] ?? 0) >= 3)) add(n, 'close');
  }
  const behind =
    o.variant === 'cutthroat'
      ? rivals.some((q) => q.score < p.score)
      : rivals.some((q) => q.score > p.score);
  // 2. When behind on points: score on numbers you own that rivals still have open.
  if (behind || rivals.length === 0) {
    for (const n of CRICKET_NUMBERS) if (mine(n) >= 3 && !closedByAll(n)) add(n, 'scoreOn');
  }
  // 3. Otherwise the highest numbers still open for you.
  for (const n of CRICKET_NUMBERS) if (mine(n) < 3) add(n, 'stillOpen');
  for (const n of CRICKET_NUMBERS) if (mine(n) >= 3 && !closedByAll(n)) add(n, 'scoreOn');
  return out;
}
