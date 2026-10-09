import { describe, expect, it } from 'vitest';
import { parseDart, type Dart } from './engine/darts';
import { generateDrills, finishesFor } from './drills';
import { analyze, rating, type GameRecord } from './stats';
import {
  checkPairing,
  playersPerRound,
  pot,
  roundName,
  roundsFor,
  suggestPairs,
} from './tournament';

const d = (...l: string[]): Dart[] => l.map((x) => parseDart(x)!);

function x01(
  id: number,
  winner: number | null,
  visits: [number, Dart[]][],
  opponent = 7,
): GameRecord {
  return {
    id,
    mode: 'casual',
    type: 'x01',
    options: { start: 101 },
    status: 'finished',
    finishedAt: `2026-09-2${id}T10:00:00.000Z`,
    winnerPlayerId: winner,
    seats: [
      { id: 1, name: 'Me', userId: 42 },
      { id: 2, name: `Rival ${opponent}`, userId: opponent },
    ],
    visits: visits.map(([playerId, darts]) => ({ playerId, darts })),
    tournamentId: null,
  };
}

describe('analyze', () => {
  const games = [
    x01(1, 1, [[1, d('T20', '1', 'D20')]]),
    x01(2, 2, [
      [1, d('T20', '20', '20')],
      [2, d('T20', '1', 'D20')],
    ]),
    x01(
      3,
      2,
      [
        [1, d('0', '0', '0')],
        [2, d('T20', '1', 'D20')],
      ],
      8,
    ),
  ];

  it('counts results per mode and per opponent', () => {
    const a = analyze(games, 42);
    expect(a.byMode.casual).toMatchObject({ played: 3, won: 1, lost: 2 });
    expect(a.opponents[0]).toMatchObject({ userId: 7, played: 2, won: 1, lost: 1 });
    expect(a.opponents[1]).toMatchObject({ userId: 8, played: 1, lost: 1 });
  });

  it('finds the most common visits, segments and the checkout', () => {
    const a = analyze(games, 42);
    expect(a.highestCheckout).toBe(101);
    expect(a.commonSegments.slice(0, 2)).toEqual([
      { key: '0', count: 3 },
      { key: 'T20', count: 2 },
    ]);
    expect(a.heat['0']).toBe(3);
    expect(a.commonVisits.map((v) => v.total)).toContain(101);
  });

  it('measures doubles only where the aim is known', () => {
    const a = analyze(games, 42);
    expect(a.doubles[20]).toEqual({ tries: 1, hits: 1 });
  });

  it('leaves skills empty without enough darts, and ignores other players', () => {
    const a = analyze(games, 42);
    expect(a.skills.every((s) => s.score === null)).toBe(true);
    expect(analyze(games, 99).byMode.casual.played).toBe(0);
  });

  it('scores skills and finds weak spots with enough darts', () => {
    const drill: GameRecord = {
      id: 9,
      mode: 'practice',
      type: 'targets',
      options: {
        targets: [
          { n: 16, m: 2 },
          { n: 20, m: 2 },
        ],
        dartsPerTarget: 15,
      },
      status: 'finished',
      finishedAt: null,
      winnerPlayerId: null,
      seats: [{ id: 1, name: 'Me', userId: 42 }],
      visits: [
        ...Array.from({ length: 5 }, () => ({ playerId: 1, darts: d('16', '8', '16') })),
        ...Array.from({ length: 5 }, () => ({ playerId: 1, darts: d('D20', 'D20', '20') })),
      ],
      tournamentId: null,
    };
    const a = analyze([drill], 42);
    const doubles = a.skills.find((s) => s.key === 'doubles')!;
    expect(doubles.sample).toBe(30);
    expect(doubles.value).toBeCloseTo(10 / 30);
    expect(a.weakDoubles[0]).toBe(16);
    expect(a.byMode.practice).toMatchObject({ played: 1, other: 1 });
  });
});

describe('drills', () => {
  it('gives a starter set without data', () => {
    const plans = generateDrills(analyze([], 1));
    expect(plans.map((p) => p.reason)).toEqual(['starter', 'starter', 'starter']);
  });

  it('trains weak doubles with targets and finishes on them', () => {
    const a = { ...analyze([], 1), weak: ['doubles' as const], weakDoubles: [16, 7] };
    const plans = generateDrills(a);
    expect(plans[0]).toMatchObject({ type: 'targets', params: { targets: 'D16, D7' } });
    expect(plans[1]).toMatchObject({ type: 'checkout' });
    expect(finishesFor([16])).toEqual([32, 52, 92]);
  });
});

describe('tournament', () => {
  it('pairs players of similar strength, giving the strongest the bye', () => {
    const e = [
      { id: 1, rating: 30, hadBye: false },
      { id: 2, rating: 70, hadBye: false },
      { id: 3, rating: 50, hadBye: false },
      { id: 4, rating: 48, hadBye: false },
      { id: 5, rating: 29, hadBye: false },
    ];
    expect(suggestPairs(e)).toEqual({
      pairs: [
        [3, 4],
        [1, 5],
      ],
      bye: 2,
    });
    expect(suggestPairs(e.map((x) => (x.id === 2 ? { ...x, hadBye: true } : x))).bye).toBe(3);
  });

  it('checks a pairing changed by the organiser', () => {
    expect(checkPairing([1, 2, 3], { pairs: [[1, 2]], bye: 3 })).toBeNull();
    expect(checkPairing([1, 2, 3], { pairs: [[1, 2]], bye: null })).toBe('pairing');
    expect(checkPairing([1, 2], { pairs: [[1, 1]], bye: null })).toBe('pairing');
  });

  it('knows the rounds and their names', () => {
    expect(roundsFor(5)).toBe(3);
    expect(playersPerRound(5)).toEqual([5, 3, 2]);
    expect(roundName(2)).toBe('final');
    expect(roundName(3)).toBe('semi');
    expect(roundName(16)).toBe('round');
  });

  it('splits the entry fees', () => {
    expect(pot(1000, 8, 10)).toEqual({ total: 8000, organizer: 800, prize: 7200 });
    expect(pot(0, 8, 10)).toEqual({ total: 0, organizer: 0, prize: 0 });
    expect(rating(null, 'advanced')).toBe(60);
  });
});
