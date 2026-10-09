import { BULL, isTreble, segmentKey, type Dart } from './engine/darts';
import { play, type Seat, type Visit, type VisitLog } from './engine/engine';
import {
  MODES,
  hitsTarget,
  normalizeOptions,
  type DrillTarget,
  type GameType,
  type Mode,
} from './engine/games';

/**
 * A player's statistics from their games: results per mode, opponents, the points they throw
 * most, where their darts land, and six skills (0–100) with their strong and weak spots. Darts
 * whose aim the rules make clear (a finishing double, Around the Clock, Shanghai, drills) measure
 * accuracy. Pure: the data layer loads the games, the pages show the result.
 */

export interface GameRecord {
  id: number;
  mode: Mode;
  type: GameType;
  options: unknown;
  status: 'waiting' | 'playing' | 'finished';
  finishedAt: string | null;
  /** The winner's player id (null: draw, solo, or not finished). */
  winnerPlayerId: number | null;
  seats: (Seat & { userId: number | null })[];
  visits: Visit[];
  tournamentId: number | null;
}

export const SKILLS = ['scoring', 'doubles', 'trebles', 'bull', 'accuracy', 'consistency'] as const;
export type SkillKey = (typeof SKILLS)[number];

export interface Skill {
  key: SkillKey;
  /** 0–100, or null without enough darts to tell. */
  score: number | null;
  /** The measured value: an average (scoring), a rate 0–1 or a spread (consistency). */
  value: number | null;
  /** Darts (or visits, for consistency) it is based on. */
  sample: number;
}

export interface ModeSummary {
  played: number;
  won: number;
  lost: number;
  /** Solo games and draws. */
  other: number;
  darts: number;
}

export interface OpponentSummary {
  userId: number | null;
  name: string;
  played: number;
  won: number;
  lost: number;
  byMode: Record<Mode, number>;
  lastAt: string | null;
}

export interface HitRate {
  tries: number;
  hits: number;
}

export interface Analysis {
  byMode: Record<Mode, ModeSummary>;
  /** X01 three-dart average. */
  average: number | null;
  bestVisit: number;
  highestCheckout: number;
  tons: { t100: number; t140: number; t180: number };
  /** The visit totals thrown most often, most frequent first. */
  commonVisits: { total: number; count: number }[];
  /** Where darts land most often ("T20", "5", "BULL"...). */
  commonSegments: { key: string; count: number }[];
  /** Darts per segment, for the board heat map. */
  heat: Record<string, number>;
  darts: number;
  doubles: Record<number, HitRate>;
  numbers: Record<number, HitRate>;
  skills: Skill[];
  strong: SkillKey[];
  weak: SkillKey[];
  /** Doubles and numbers hit least often (at least a few tries). */
  weakDoubles: number[];
  weakNumbers: number[];
  opponents: OpponentSummary[];
}

/** Minimum sample for a skill to be shown. */
const MIN_SAMPLE: Record<SkillKey, number> = {
  scoring: 30,
  doubles: 10,
  trebles: 30,
  bull: 9,
  accuracy: 20,
  consistency: 10,
};

/** The value that counts as 100 (a strong club player). */
const TOP: Record<Exclude<SkillKey, 'consistency'>, number> = {
  scoring: 90,
  doubles: 0.4,
  trebles: 0.35,
  bull: 0.35,
  accuracy: 0.7,
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const emptyMode = (): ModeSummary => ({ played: 0, won: 0, lost: 0, other: 0, darts: 0 });
const bump = (map: Record<number, HitRate>, key: number, hit: boolean) => {
  const r = (map[key] ??= { tries: 0, hits: 0 });
  r.tries += 1;
  if (hit) r.hits += 1;
};
const top = <K>(counts: Map<K, number>, n: number) =>
  [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

/** Replays a game (null when its stored visits no longer replay). */
function replay(g: GameRecord): VisitLog[] | null {
  try {
    return play(
      { type: g.type, options: normalizeOptions(g.type, g.options), seats: g.seats },
      g.visits,
    ).visits;
  } catch {
    return null;
  }
}

export function analyze(games: GameRecord[], userId: number): Analysis {
  const byMode = Object.fromEntries(MODES.map((m) => [m, emptyMode()])) as Record<
    Mode,
    ModeSummary
  >;
  const opponents = new Map<string, OpponentSummary>();
  const visitTotals = new Map<number, number>();
  const segments = new Map<string, number>();
  const doubles: Record<number, HitRate> = {};
  const numbers: Record<number, HitRate> = {};
  const bull: HitRate = { tries: 0, hits: 0 };
  const trebles: HitRate = { tries: 0, hits: 0 };
  const scoringTotals: number[] = [];
  let x01Points = 0;
  let x01Darts = 0;
  let darts = 0;
  let bestVisit = 0;
  let highestCheckout = 0;
  const tons = { t100: 0, t140: 0, t180: 0 };

  for (const g of games) {
    const me = g.seats.find((s) => s.userId === userId);
    if (!me) continue;
    const logs = replay(g);
    if (!logs) continue;
    const mine = logs.filter((v) => v.playerId === me.id);
    const summary = byMode[g.mode];
    const thrown = mine.reduce((s, v) => s + v.darts.length, 0);
    summary.darts += thrown;
    darts += thrown;

    if (g.status === 'finished') {
      summary.played += 1;
      const won = g.winnerPlayerId === me.id;
      const lost = g.winnerPlayerId !== null && !won;
      if (won) summary.won += 1;
      else if (lost) summary.lost += 1;
      else summary.other += 1;
      for (const o of g.seats) {
        if (o.id === me.id) continue;
        const key = o.userId === null ? `x${g.id}-${o.id}` : `u${o.userId}`;
        const row = opponents.get(key) ?? {
          userId: o.userId,
          name: o.name,
          played: 0,
          won: 0,
          lost: 0,
          byMode: { practice: 0, casual: 0, tournament: 0 },
          lastAt: null,
        };
        row.played += 1;
        row.byMode[g.mode] += 1;
        if (won) row.won += 1;
        if (g.winnerPlayerId === o.id) row.lost += 1;
        if (g.finishedAt && (!row.lastAt || g.finishedAt > row.lastAt)) {
          row.lastAt = g.finishedAt;
          row.name = o.name;
        }
        opponents.set(key, row);
      }
    }

    for (const v of mine) {
      if (v.darts.length === 3) visitTotals.set(v.total, (visitTotals.get(v.total) ?? 0) + 1);
      bestVisit = Math.max(bestVisit, v.total);
      if (v.total >= 180) tons.t180 += 1;
      else if (v.total >= 140) tons.t140 += 1;
      else if (v.total >= 100) tons.t100 += 1;
      if (g.type === 'x01') {
        x01Points += v.scored;
        x01Darts += v.darts.length;
        if (v.events.includes('leg') || v.events.includes('win')) {
          highestCheckout = Math.max(highestCheckout, v.scored);
        }
      }
      if (v.scoring && v.darts.length === 3) scoringTotals.push(v.total);
      v.darts.forEach((d, i) => {
        const key = segmentKey(d);
        segments.set(key, (segments.get(key) ?? 0) + 1);
        const aim = v.aims[i] ?? null;
        if (v.scoring) {
          trebles.tries += 1;
          if (isTreble(d)) trebles.hits += 1;
        }
        if (aim) countAim(aim, d, { doubles, numbers, bull, trebles });
      });
    }
  }

  const rate = (r: HitRate) => (r.tries ? r.hits / r.tries : null);
  const sumRates = (map: Record<number, HitRate>) =>
    Object.values(map).reduce(
      (acc, r) => ({ tries: acc.tries + r.tries, hits: acc.hits + r.hits }),
      { tries: 0, hits: 0 },
    );
  const average = x01Darts ? (x01Points / x01Darts) * 3 : null;
  const doublesAll = sumRates(doubles);
  const numbersAll = sumRates(numbers);
  const mean = scoringTotals.reduce((s, v) => s + v, 0) / (scoringTotals.length || 1);
  const spread = scoringTotals.length
    ? Math.sqrt(scoringTotals.reduce((s, v) => s + (v - mean) ** 2, 0) / scoringTotals.length) /
      (mean || 1)
    : null;

  const skill = (key: SkillKey, value: number | null, sample: number): Skill => {
    const enough = value !== null && sample >= MIN_SAMPLE[key];
    let score: number | null = null;
    if (enough) {
      score = key === 'consistency' ? clamp((1 - value) * 100) : clamp((value / TOP[key]) * 100);
    }
    return { key, score, value: enough ? value : null, sample };
  };
  const skills: Skill[] = [
    skill('scoring', average, x01Darts),
    skill('doubles', rate(doublesAll), doublesAll.tries),
    skill('trebles', rate(trebles), trebles.tries),
    skill('bull', rate(bull), bull.tries),
    skill('accuracy', rate(numbersAll), numbersAll.tries),
    skill('consistency', spread, scoringTotals.length),
  ];
  const measured = skills.filter((s) => s.score !== null).sort((a, b) => b.score! - a.score!);
  const strong = measured.filter((s) => s.score! >= 50).slice(0, 2);
  const weak = measured
    .filter((s) => s.score! < 70 && !strong.includes(s))
    .reverse()
    .slice(0, 3);
  const weakest = (map: Record<number, HitRate>) =>
    Object.entries(map)
      .filter(([, r]) => r.tries >= 3)
      .sort(([, a], [, b]) => a.hits / a.tries - b.hits / b.tries)
      .slice(0, 3)
      .map(([n]) => Number(n));

  return {
    byMode,
    average,
    bestVisit,
    highestCheckout,
    tons,
    commonVisits: top(visitTotals, 8).map(([total, count]) => ({ total, count })),
    commonSegments: top(segments, 10).map(([key, count]) => ({ key, count })),
    heat: Object.fromEntries(segments),
    darts,
    doubles,
    numbers,
    skills,
    strong: strong.map((s) => s.key),
    weak: weak.map((s) => s.key),
    weakDoubles: weakest(doubles),
    weakNumbers: weakest(numbers),
    opponents: [...opponents.values()].sort(
      (a, b) => b.played - a.played || a.name.localeCompare(b.name),
    ),
  };
}

function countAim(
  aim: DrillTarget,
  d: Dart,
  acc: {
    doubles: Record<number, HitRate>;
    numbers: Record<number, HitRate>;
    bull: HitRate;
    trebles: HitRate;
  },
) {
  const hit = hitsTarget(aim, d);
  if (aim.n === BULL) {
    acc.bull.tries += 1;
    if (hit) acc.bull.hits += 1;
  } else if (aim.m === 2) bump(acc.doubles, aim.n, hit);
  else if (aim.m === 3) {
    acc.trebles.tries += 1;
    if (hit) acc.trebles.hits += 1;
  } else bump(acc.numbers, aim.n, hit);
}

/** A rating to pair tournament players of similar strength: the X01 average, else the level. */
export function rating(average: number | null, level: string | null): number {
  if (average !== null) return Math.round(average * 10) / 10;
  return level === 'advanced' ? 60 : level === 'intermediate' ? 45 : 30;
}
