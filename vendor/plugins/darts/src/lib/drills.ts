import { BULL } from './engine/darts';
import type { DrillTarget, GameType, OptionsByType } from './engine/games';
import type { Analysis, SkillKey } from './stats';

/**
 * Practice made for a player from their weak spots (their statistics page): targets on the
 * doubles they miss, finishes ending on them, trebles, the bull, Around the Clock for accuracy
 * and Count-Up for scoring. Without enough data, a starter set. Pure.
 */

export type DrillReason = SkillKey | 'starter';

export interface DrillPlan<T extends GameType = GameType> {
  reason: DrillReason;
  type: T;
  options: OptionsByType[T];
  /** Values for the drill's title and description (translated by the screens). */
  params: Record<string, string | number>;
}

export const MAX_DRILLS = 4;
const DEFAULT_DOUBLES = [20, 16, 8];

const label = (t: DrillTarget) =>
  t.n === BULL ? (t.m === 2 ? 'BULL' : '25') : `${['', '', 'D', 'T'][t.m] ?? ''}${t.n}`;

function targetsDrill(
  reason: DrillReason,
  targets: DrillTarget[],
  darts = 9,
): DrillPlan<'targets'> {
  return {
    reason,
    type: 'targets',
    options: { targets, dartsPerTarget: darts },
    params: { targets: targets.map(label).join(', '), darts },
  };
}

/** Finishes that end on these doubles: straight on it, after a 20, after a treble 20. */
export function finishesFor(doubles: number[]): number[] {
  const out = new Set<number>();
  for (const n of doubles) {
    const d = n * 2;
    for (const f of [d, d + 20, d + 60]) if (f <= 170) out.add(f);
  }
  return [...out].sort((a, b) => a - b).slice(0, 8);
}

const drillFor: Record<SkillKey, (a: Analysis) => DrillPlan> = {
  doubles: (a) => {
    const doubles = a.weakDoubles.length ? a.weakDoubles : DEFAULT_DOUBLES;
    return targetsDrill(
      'doubles',
      doubles.map((n) => ({ n, m: 2 })),
    );
  },
  scoring: () =>
    targetsDrill(
      'scoring',
      [
        { n: 20, m: 3 },
        { n: 19, m: 3 },
      ],
      15,
    ),
  trebles: () =>
    targetsDrill('trebles', [
      { n: 20, m: 3 },
      { n: 19, m: 3 },
      { n: 18, m: 3 },
    ]),
  bull: () =>
    targetsDrill('bull', [
      { n: BULL, m: 0 },
      { n: BULL, m: 2 },
    ]),
  accuracy: (a) =>
    a.weakNumbers.length
      ? targetsDrill(
          'accuracy',
          a.weakNumbers.map((n) => ({ n, m: 1 })),
          6,
        )
      : { reason: 'accuracy', type: 'atc', options: { hit: 'any' }, params: {} },
  consistency: () => ({
    reason: 'consistency',
    type: 'countup',
    options: { rounds: 10 },
    params: { rounds: 10 },
  }),
};

/** Up to four drills for the player's weak spots (a starter set without enough data). */
export function generateDrills(a: Analysis): DrillPlan[] {
  const plans: DrillPlan[] = [];
  for (const key of a.weak) plans.push(drillFor[key](a));
  // Missed doubles also mean missed finishes: practise finishes ending on them.
  if (a.weak.includes('doubles')) {
    const doubles = a.weakDoubles.length ? a.weakDoubles : DEFAULT_DOUBLES;
    const finishes = finishesFor(doubles);
    plans.push({
      reason: 'doubles',
      type: 'checkout',
      options: { finishes, dartsPerFinish: 9 },
      params: { finishes: finishes.join(', ') },
    });
  }
  if (plans.length === 0) {
    plans.push(
      { reason: 'starter', type: 'atc', options: { hit: 'any' }, params: {} },
      targetsDrill(
        'starter',
        DEFAULT_DOUBLES.map((n) => ({ n, m: 2 })),
      ),
      { reason: 'starter', type: 'countup', options: { rounds: 8 }, params: { rounds: 8 } },
    );
  }
  return plans.slice(0, MAX_DRILLS);
}
