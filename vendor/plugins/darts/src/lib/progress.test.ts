import { describe, expect, it } from 'vitest';
import { parseDart, type Dart } from './engine/darts';
import { play } from './engine/engine';
import { normalizeOptions } from './engine/games';
import { matchesName, normalizeName, playerSummary, progressOf } from './progress';

const d = (...l: string[]): Dart[] => l.map((x) => parseDart(x)!);

describe('progress', () => {
  const state = play(
    {
      type: 'x01',
      options: normalizeOptions('x01', { start: 101 }),
      seats: [
        { id: 1, name: 'Ána', number: null },
        { id: 2, name: 'Bob', number: null },
      ],
    },
    [
      { playerId: 1, darts: d('T20', '20', '1') },
      { playerId: 2, darts: d('T20', 'T20') },
      { playerId: 1, darts: d('D10') },
    ],
  );
  const match = progressOf(state, 'g1');

  it('lists every visit in order with the score after it', () => {
    expect(match.visits.map((v) => [v.n, v.playerId, v.darts, v.after])).toEqual([
      [1, 1, 'T20 20 1', 20],
      [2, 2, 'T20 T20', 101],
      [3, 1, 'D10', 0],
    ]);
    expect(match.players[0]!.start).toBe(101);
    expect(match.winnerId).toBe(1);
  });

  it('sums up one player', () => {
    expect(playerSummary(match, 1)).toMatchObject({
      visits: 2,
      darts: 4,
      best: 81,
      bestFinish: 20,
    });
    expect(playerSummary(match, 2)).toMatchObject({ visits: 1, busts: 1 });
  });

  it('finds names without case or accents', () => {
    expect(normalizeName(' Ána ')).toBe('ana');
    expect(matchesName('Ána Pop', 'ana')).toBe(true);
    expect(matchesName('Bob', 'ana')).toBe(false);
    expect(matchesName('Bob', '')).toBe(true);
  });
});
