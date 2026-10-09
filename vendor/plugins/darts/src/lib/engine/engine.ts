import { BULL, dartValue, isDouble, isTreble, type Dart } from './darts';
import {
  hitsTarget,
  normalizeOptions,
  type AtcOptions,
  type CheckoutOptions,
  type CountupOptions,
  type CricketOptions,
  type DrillTarget,
  type GameType,
  type KillerOptions,
  type OptionsByType,
  type ShanghaiOptions,
  type TargetsOptions,
  type X01Options,
} from './games';

/**
 * The rules of every game as one pure replay: a game's state is always computed from its
 * players and the visits (three darts) thrown so far. The server validates a new visit by
 * replaying it; the browser uses the same code to preview darts before they are sent and to
 * suggest the next shots. Nothing here knows about users, the database or languages.
 */

/** A player in the order they throw. `id` is the game's player id, not the user id. */
export interface Seat {
  id: number;
  name: string;
  /** Killer: the player's number (1–20), drawn when the game starts. */
  number?: number | null;
}

export interface Visit {
  playerId: number;
  darts: Dart[];
}

export interface GameSetup<T extends GameType = GameType> {
  type: T;
  options: OptionsByType[T];
  seats: Seat[];
}

export type EventKind =
  | 'bust'
  | 'leg'
  | 'win'
  | 'shanghai'
  | 'killer'
  | 'eliminated'
  | 'checkout'
  | 'missed'
  | 'tiebreak';

export interface VisitLog {
  playerId: number;
  leg: number;
  round: number;
  darts: Dart[];
  /** Where each dart was aimed when the rules make it clear (null when not known). */
  aims: (DrillTarget | null)[];
  /** The sum of the darts' values. */
  total: number;
  /** What counted in the game (X01: points taken off; 0 on a bust). */
  scored: number;
  /** X01: the score left before the visit. */
  before: number | null;
  /** A pure scoring visit (X01 too far from a finish, Count-Up): for averages. */
  scoring: boolean;
  events: EventKind[];
  /**
   * The player's number after the visit, as the scoreboard shows it: X01 score left (0 after a
   * finish), points, lives, targets done, or what is left of a drill's finish.
   */
  after: number;
}

export interface PlayerState {
  id: number;
  name: string;
  /** X01: score left · Cricket, Shanghai, Count-Up: points · Killer: lives · drills: hits. */
  score: number;
  legs: number;
  darts: number;
  /** Cricket: marks on 15–20 and the bull. */
  marks: Record<number, number>;
  /** X01 with double-in: the player has hit the opening double. */
  opened: boolean;
  /** Around the Clock, drills: index of the current target or finish. */
  step: number;
  /** Drills: darts (targets) or visits (checkout) spent on the current step. */
  stepUsed: number;
  /** Checkout drill: what is left of the current finish. */
  remaining: number;
  number: number | null;
  killer: boolean;
  /** Out of the game (Killer: no lives; a tie-break without them). */
  out: boolean;
}

export interface GameState<T extends GameType = GameType> {
  type: T;
  options: OptionsByType[T];
  players: PlayerState[];
  /** The player whose turn it is (null once finished). */
  current: number | null;
  leg: number;
  round: number;
  finished: boolean;
  /** The winner's player id; null while playing, for a draw, or in solo drills. */
  winner: number | null;
  visits: VisitLog[];
}

/** A visit the rules refuse; `code` is a translation key (errors.<code>). */
export class EngineError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export const CRICKET_NUMBERS = [20, 19, 18, 17, 16, 15, BULL] as const;
export const ATC_SEQUENCE = [...Array.from({ length: 20 }, (_, i) => i + 1), BULL];
export const DARTS_PER_VISIT = 3;

// ---- per-visit context ------------------------------------------------------------------------

interface VisitCtx {
  player: PlayerState;
  darts: Dart[];
  aims: (DrillTarget | null)[];
  events: EventKind[];
  /** The visit ended before three darts (checkout, bust, instant win). */
  over: boolean;
  startScore: number;
  startOpened: boolean;
  scored: number;
  scoring: boolean;
  /** Set when the visit ends a leg or a finish, before the next one resets the score. */
  after?: number;
}

interface Rules {
  init(state: GameState): void;
  /** Where the next dart is aimed, if the rules make it clear (for statistics). */
  aim(state: GameState, p: PlayerState): DrillTarget | null;
  dart(state: GameState, v: VisitCtx, d: Dart): void;
  /** After the visit (all darts, or ended early). */
  endVisit?(state: GameState, v: VisitCtx): void;
  /** When play comes back to the first player: round-based endings. */
  endRound?(state: GameState): void;
}

const others = (state: GameState, p: PlayerState) =>
  state.players.filter((o) => o.id !== p.id && !o.out);

function finish(state: GameState, winner: PlayerState | null, v?: VisitCtx) {
  state.finished = true;
  state.current = null;
  state.winner = state.players.length > 1 ? (winner?.id ?? null) : null;
  if (v) {
    v.over = true;
    if (winner) v.events.push('win');
  }
}

/** A leg is won: the match is over, or every player starts the next leg. */
function winLeg(state: GameState, p: PlayerState, v: VisitCtx, legsToWin: number) {
  p.legs += 1;
  v.over = true;
  v.after = state.type === 'x01' ? 0 : p.score;
  if (p.legs >= legsToWin) return finish(state, p, v);
  v.events.push('leg');
  state.leg += 1;
  rules[state.type].init(state);
  // The next leg is started by the next player in turn (see nextTurn).
}

// ---- X01 --------------------------------------------------------------------------------------

/** The double (or bull) that finishes `score` with one dart, if any. */
export function oneDartFinish(score: number): DrillTarget | null {
  if (score === 50) return { n: BULL, m: 2 };
  if (score >= 2 && score <= 40 && score % 2 === 0) return { n: score / 2, m: 2 };
  return null;
}

const x01: Rules = {
  init(state) {
    const o = state.options as X01Options;
    for (const p of state.players) {
      p.score = o.start;
      p.opened = o.in === 'straight';
    }
  },
  aim(state, p) {
    const o = state.options as X01Options;
    if (!p.opened) return null;
    return o.out === 'double' ? oneDartFinish(p.score) : null;
  },
  dart(state, v, d) {
    const o = state.options as X01Options;
    const p = v.player;
    if (!p.opened) {
      if (!isDouble(d)) return;
      p.opened = true;
    }
    const left = p.score - dartValue(d);
    const validOut = o.out === 'single' || isDouble(d) || (o.out === 'master' && isTreble(d));
    if (left < 0 || (left === 1 && o.out !== 'single') || (left === 0 && !validOut)) {
      v.events.push('bust');
      p.score = v.startScore;
      p.opened = v.startOpened;
      v.over = true;
      return;
    }
    p.score = left;
    if (left === 0) {
      v.scored = v.startScore;
      winLeg(state, p, v, o.legs);
    }
  },
  endVisit(_state, v) {
    if (!v.events.includes('bust') && !v.events.includes('leg') && !v.events.includes('win')) {
      v.scored = v.startScore - v.player.score;
    }
  },
};

// ---- Cricket ----------------------------------------------------------------------------------

const cricket: Rules = {
  init(state) {
    for (const p of state.players) {
      p.score = 0;
      p.marks = Object.fromEntries(CRICKET_NUMBERS.map((n) => [n, 0]));
    }
  },
  aim: () => null,
  dart(state, v, d) {
    const o = state.options as CricketOptions;
    const p = v.player;
    if (!(CRICKET_NUMBERS as readonly number[]).includes(d.n)) return;
    const before = p.marks[d.n] ?? 0;
    p.marks[d.n] = before + d.m;
    const extra = Math.max(0, d.m - Math.max(0, 3 - before));
    if (extra > 0) {
      const open = others(state, p).filter((q) => (q.marks[d.n] ?? 0) < 3);
      const points = extra * d.n;
      v.scored += points;
      if (o.variant === 'cutthroat') for (const q of open) q.score += points;
      else if (open.length) p.score += points;
    }
    const closedAll = CRICKET_NUMBERS.every((n) => (p.marks[n] ?? 0) >= 3);
    if (!closedAll) return;
    const rest = others(state, p);
    const ahead =
      o.variant === 'cutthroat'
        ? rest.every((q) => p.score <= q.score)
        : rest.every((q) => p.score >= q.score);
    if (ahead) winLeg(state, p, v, o.legs);
  },
};

// ---- Shanghai ---------------------------------------------------------------------------------

/** Shanghai's number this round (the bull in a tie-break). */
export const shanghaiTarget = (state: GameState) => {
  const o = state.options as ShanghaiOptions;
  return state.round <= o.rounds ? state.round : BULL;
};

/** After the last round (or a tie-break): the best player wins; tied leaders play on. */
function endByPoints(state: GameState, lastRound: number) {
  if (state.round <= lastRound) return;
  const alive = state.players.filter((p) => !p.out);
  const best = Math.max(...alive.map((p) => p.score));
  const leaders = alive.filter((p) => p.score === best);
  if (leaders.length === 1 || state.players.length === 1) {
    finish(state, leaders[0] ?? null);
    return;
  }
  // A tie-break round between the leaders.
  for (const p of alive) if (p.score !== best) p.out = true;
}

const shanghai: Rules = {
  init(state) {
    for (const p of state.players) p.score = 0;
  },
  aim: (state) => ({ n: shanghaiTarget(state), m: 0 }),
  dart(state, v, d) {
    const target = shanghaiTarget(state);
    if (d.n !== target) return;
    v.player.score += dartValue(d);
    v.scored += dartValue(d);
    if (target === BULL) return;
    const hit = new Set(v.darts.filter((x) => x.n === target).map((x) => x.m));
    if (hit.has(1) && hit.has(2) && hit.has(3)) {
      v.events.push('shanghai');
      finish(state, v.player, v);
    }
  },
  endRound(state) {
    endByPoints(state, (state.options as ShanghaiOptions).rounds);
  },
};

// ---- Around the Clock -------------------------------------------------------------------------

const atc: Rules = {
  init(state) {
    for (const p of state.players) {
      p.step = 0;
      p.score = 0;
    }
  },
  aim(state, p) {
    const o = state.options as AtcOptions;
    const n = ATC_SEQUENCE[p.step];
    return n === undefined ? null : { n, m: o.hit === 'doubles' ? 2 : 0 };
  },
  dart(state, v, d) {
    const target = atc.aim(state, v.player);
    if (!target || !hitsTarget(target, d)) return;
    v.player.step += 1;
    v.player.score = v.player.step;
    v.scored += 1;
    if (v.player.step >= ATC_SEQUENCE.length) finish(state, v.player, v);
  },
};

// ---- Killer -----------------------------------------------------------------------------------

const killer: Rules = {
  init(state) {
    const o = state.options as KillerOptions;
    for (const p of state.players) {
      p.score = o.lives;
      p.killer = false;
      p.out = false;
    }
  },
  aim: (_state, p) => (!p.killer && p.number ? { n: p.number, m: 2 } : null),
  dart(state, v, d) {
    const p = v.player;
    if (!isDouble(d)) return;
    if (!p.killer) {
      if (d.n === p.number) {
        p.killer = true;
        v.events.push('killer');
      }
      return;
    }
    for (const q of others(state, p)) {
      if (q.number !== d.n) continue;
      q.score -= 1;
      v.scored += 1;
      if (q.score <= 0) {
        q.score = 0;
        q.out = true;
        v.events.push('eliminated');
      }
    }
    const alive = state.players.filter((q) => !q.out);
    if (alive.length === 1) finish(state, alive[0]!, v);
  },
};

// ---- Count-Up ---------------------------------------------------------------------------------

const countup: Rules = {
  init(state) {
    for (const p of state.players) p.score = 0;
  },
  aim: () => null,
  dart(_state, v, d) {
    v.player.score += dartValue(d);
    v.scored += dartValue(d);
    v.scoring = true;
  },
  endRound(state) {
    endByPoints(state, (state.options as CountupOptions).rounds);
  },
};

// ---- Drills -----------------------------------------------------------------------------------

const targets: Rules = {
  init(state) {
    for (const p of state.players) {
      p.score = 0;
      p.step = 0;
      p.stepUsed = 0;
    }
  },
  aim(state, p) {
    return (state.options as TargetsOptions).targets[p.step] ?? null;
  },
  dart(state, v, d) {
    const o = state.options as TargetsOptions;
    const p = v.player;
    const target = o.targets[p.step];
    if (!target) return;
    if (hitsTarget(target, d)) {
      p.score += 1;
      v.scored += 1;
    }
    p.stepUsed += 1;
    if (p.stepUsed >= o.dartsPerTarget) {
      p.step += 1;
      p.stepUsed = 0;
      if (p.step >= o.targets.length) finish(state, null, v);
    }
  },
};

const checkout: Rules = {
  init(state) {
    const o = state.options as CheckoutOptions;
    for (const p of state.players) {
      p.score = 0;
      p.step = 0;
      p.stepUsed = 0;
      p.remaining = o.finishes[0] ?? 0;
    }
  },
  aim: (_state, p) => oneDartFinish(p.remaining),
  dart(state, v, d) {
    const o = state.options as CheckoutOptions;
    const p = v.player;
    const left = p.remaining - dartValue(d);
    if (left < 0 || left === 1 || (left === 0 && !isDouble(d))) {
      p.remaining = v.startScore;
      v.events.push('bust');
      v.over = true;
      return;
    }
    p.remaining = left;
    if (left === 0) {
      p.score += 1;
      v.scored += 1;
      v.events.push('checkout');
      nextFinish(state, p, o, v);
    }
  },
  endVisit(state, v) {
    const o = state.options as CheckoutOptions;
    const p = v.player;
    if (v.events.includes('checkout') || state.finished) return;
    p.stepUsed += 1;
    if (p.stepUsed >= o.dartsPerFinish / DARTS_PER_VISIT) {
      v.events.push('missed');
      nextFinish(state, p, o, v);
    }
  },
};

function nextFinish(state: GameState, p: PlayerState, o: CheckoutOptions, v: VisitCtx) {
  v.after = p.remaining;
  p.step += 1;
  p.stepUsed = 0;
  v.over = true;
  const next = o.finishes[p.step];
  if (next === undefined) finish(state, null, v);
  else p.remaining = next;
}

const rules: Record<GameType, Rules> = {
  x01,
  cricket,
  shanghai,
  atc,
  killer,
  countup,
  targets,
  checkout,
};

// ---- the replay -------------------------------------------------------------------------------

/** The state before any dart is thrown. */
export function newGame<T extends GameType>(setup: GameSetup<T>): GameState<T> {
  if (setup.seats.length === 0) throw new EngineError('noPlayers');
  const state: GameState<T> = {
    type: setup.type,
    options: normalizeOptions(setup.type, setup.options),
    players: setup.seats.map((s) => ({
      id: s.id,
      name: s.name,
      score: 0,
      legs: 0,
      darts: 0,
      marks: {},
      opened: true,
      step: 0,
      stepUsed: 0,
      remaining: 0,
      number: s.number ?? null,
      killer: false,
      out: false,
    })),
    current: setup.seats[0]!.id,
    leg: 1,
    round: 1,
    finished: false,
    winner: null,
    visits: [],
  };
  rules[setup.type].init(state);
  return state;
}

/** The player who starts leg `leg` (the start rotates with every leg). */
function legStarter(state: GameState): PlayerState {
  return state.players[(state.leg - 1) % state.players.length]!;
}

function nextTurn(state: GameState, legChanged: boolean) {
  if (state.finished) return;
  if (legChanged) {
    state.current = legStarter(state).id;
    return;
  }
  const n = state.players.length;
  const roundStart = state.players.indexOf(legStarter(state));
  let index = state.players.findIndex((p) => p.id === state.current);
  for (let step = 0; step < n; step++) {
    index = (index + 1) % n;
    if (index === roundStart) {
      // Everyone has thrown: a new round (round-based games may end here).
      state.round += 1;
      rules[state.type].endRound?.(state);
      if (state.finished) return;
    }
    const next = state.players[index]!;
    if (!next.out) {
      state.current = next.id;
      return;
    }
  }
}

/**
 * Throws `darts` for the current player. With `partial`, fewer than three darts are fine (the
 * browser's preview); otherwise a visit is three darts unless it ended early (checkout, bust,
 * Shanghai...). Mutates `state`; returns whether the visit is over.
 */
function throwVisit(
  state: GameState,
  visit: Visit,
  partial: boolean,
): { over: boolean; events: EventKind[] } {
  if (state.finished) throw new EngineError('gameOver');
  if (visit.playerId !== state.current) throw new EngineError('notYourTurn');
  const p = state.players.find((q) => q.id === visit.playerId)!;
  const game = rules[state.type];
  const legBefore = state.leg;
  const v: VisitCtx = {
    player: p,
    darts: [],
    aims: [],
    events: [],
    over: false,
    startScore: state.type === 'checkout' ? p.remaining : p.score,
    startOpened: p.opened,
    scored: 0,
    scoring: state.type === 'x01' && p.opened && p.score > 170,
  };
  const before = state.type === 'x01' ? p.score : null;
  const round = state.round;
  if (visit.darts.length > DARTS_PER_VISIT) throw new EngineError('tooManyDarts');
  for (const d of visit.darts) {
    if (v.over) throw new EngineError('visitOver');
    v.aims.push(game.aim(state, p));
    v.darts.push(d);
    p.darts += 1;
    game.dart(state, v, d);
  }
  const complete = v.over || v.darts.length === DARTS_PER_VISIT;
  if (!complete && !partial) throw new EngineError('threeDarts');
  if (!complete) return { over: false, events: v.events };
  game.endVisit?.(state, v);
  state.visits.push({
    playerId: p.id,
    leg: legBefore,
    round,
    darts: v.darts,
    aims: v.aims,
    total: v.darts.reduce((sum, d) => sum + dartValue(d), 0),
    scored: v.scored,
    before,
    scoring: v.scoring,
    events: v.events,
    after:
      v.after ??
      (state.type === 'checkout' ? p.remaining : state.type === 'atc' ? p.step : p.score),
  });
  nextTurn(state, state.leg !== legBefore);
  return { over: true, events: v.events };
}

/** The game after these visits; throws EngineError at the first visit the rules refuse. */
export function play<T extends GameType>(setup: GameSetup<T>, visits: Visit[]): GameState<T> {
  const state = newGame(setup);
  for (const visit of visits) throwVisit(state, visit, false);
  return state;
}

export interface Preview<T extends GameType = GameType> {
  state: GameState<T>;
  /** No more darts can be thrown in this visit (it ended early, or three were thrown). */
  over: boolean;
  events: EventKind[];
}

/**
 * The state with some darts of the current visit already thrown (not yet sent). Throws
 * EngineError when a dart cannot be thrown.
 */
export function preview<T extends GameType>(state: GameState<T>, darts: Dart[]): Preview<T> {
  const copy = structuredClone(state);
  if (copy.current === null) throw new EngineError('gameOver');
  const { over, events } = throwVisit(copy, { playerId: copy.current, darts }, true);
  return { state: copy, over, events };
}

/** A player of the game by id. */
export function playerOf(state: GameState, id: number | null): PlayerState | null {
  return state.players.find((p) => p.id === id) ?? null;
}

/** Where the current player should aim next, when the rules make it clear. */
export function currentTarget(state: GameState): DrillTarget | null {
  const p = playerOf(state, state.current);
  return p ? rules[state.type].aim(state, p) : null;
}
