import { describe, expect, it } from 'vitest';
import { dartLabel, parseDart, type Dart } from './darts';
import { play, preview, type Seat } from './engine';
import { normalizeOptions, type GameType } from './games';
import { compose, quickPicks } from './quick';

const d = (...l: string[]): Dart[] => l.map((x) => parseDart(x)!);
const labels = (darts: Dart[]) => darts.map(dartLabel).join(' ');
const seats: Seat[] = [
  { id: 1, name: 'A', number: 5 },
  { id: 2, name: 'B', number: 17 },
];
const game = (type: GameType, options: object = {}) =>
  play({ type, options: normalizeOptions(type, options), seats }, []);

describe('compose', () => {
  it('builds totals from the darts around the 20', () => {
    expect(labels(compose(26, 3)!)).toBe('20 5 1');
    expect(labels(compose(60, 3)!)).toBe('20 20 20');
    expect(labels(compose(180, 3)!)).toBe('T20 T20 T20');
    expect(labels(compose(0, 3)!)).toBe('0 0 0');
  });

  it('knows what three darts cannot make', () => {
    for (const total of [163, 166, 169, 172, 173, 175, 176, 178, 179, 181]) {
      expect(compose(total, 3), String(total)).toBeNull();
    }
    expect(compose(61, 1)).toBeNull();
  });
});

describe('quickPicks', () => {
  it('only offers visits the rules accept, each ending the visit', () => {
    for (const type of ['x01', 'cricket', 'shanghai', 'atc', 'killer', 'countup'] as GameType[]) {
      const base = game(type);
      for (const pending of [[], d('20'), d('20', '1')]) {
        let ok = true;
        try {
          preview(base, pending);
        } catch {
          ok = false;
        }
        if (!ok) continue;
        const picks = quickPicks(base, pending);
        expect(picks.length, `${type} after ${pending.length}`).toBeGreaterThan(0);
        for (const pick of picks) {
          expect(pick.darts.length).toBeLessThanOrEqual(3 - pending.length);
          expect(preview(base, [...pending, ...pick.darts]).over).toBe(true);
        }
      }
    }
  });

  it('puts finishes first and never busts', () => {
    const base = game('x01', { start: 100 });
    const picks = quickPicks(base, []);
    expect(picks[0]).toMatchObject({ kind: 'finish', total: 100 });
    expect(picks.every((p) => p.total <= 98 || p.kind === 'finish')).toBe(true);
  });

  it('scores far from a finish, with the player’s own habits first', () => {
    const base = game('x01');
    const picks = quickPicks(base, [], [d('T20', '5', '1')]);
    expect(picks[0]).toMatchObject({ kind: 'habit', total: 66 });
    expect(picks.map((p) => p.total)).toEqual(expect.arrayContaining([60, 100, 140, 180, 26]));
  });

  it('fills only the darts left', () => {
    const picks = quickPicks(game('x01'), d('T20', 'T20'));
    expect(picks.every((p) => p.darts.length === 1)).toBe(true);
    expect(picks.map((p) => p.total)).toContain(60);
  });

  it('offers the Shanghai and hits on the round’s number', () => {
    const picks = quickPicks(game('shanghai'), []);
    expect(labels(picks[0]!.darts)).toBe('T1 D1 1');
    expect(picks.at(-1)).toMatchObject({ kind: 'miss', total: 0 });
  });
});
