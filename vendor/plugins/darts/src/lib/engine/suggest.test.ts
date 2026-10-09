import { describe, expect, it } from 'vitest';
import { dartLabel, parseDart, type Dart } from './darts';
import { play, preview, type Seat } from './engine';
import { normalizeOptions } from './games';
import { NO_CHECKOUT, checkoutRoutes, setupRoutes, suggestions, x01Suggestions } from './suggest';

const labels = (route: Dart[]) => route.map(dartLabel).join(' ');
const d = (...l: string[]) => l.map((x) => parseDart(x)!);

describe('checkout routes', () => {
  it('knows the classic finishes', () => {
    expect(labels(checkoutRoutes(170, 3)[0]!)).toBe('T20 T20 BULL');
    expect(labels(checkoutRoutes(100, 3)[0]!)).toBe('T20 D20');
    expect(labels(checkoutRoutes(40, 3)[0]!)).toBe('D20');
    expect(labels(checkoutRoutes(60, 3)[0]!)).toBe('20 D20');
    expect(['T19 D12', 'T15 D18']).toContain(labels(checkoutRoutes(81, 3)[0]!));
  });

  it('offers up to three different routes, all adding up and ending on a double', () => {
    for (const score of [2, 3, 41, 99, 121, 141, 160, 170]) {
      const routes = checkoutRoutes(score, 3);
      expect(routes.length, String(score)).toBeGreaterThan(0);
      expect(routes.length).toBeLessThanOrEqual(3);
      const keys = new Set(routes.map(labels));
      expect(keys.size).toBe(routes.length);
      for (const r of routes) {
        expect(r.reduce((s, x) => s + x.n * x.m, 0)).toBe(score);
        expect(r[r.length - 1]!.m).toBe(2);
      }
    }
  });

  it('has no three-dart finish for the known bogey numbers, and one for every other score', () => {
    for (let score = 2; score <= 170; score++) {
      const has = checkoutRoutes(score, 3, 'double', null, 1).length > 0;
      expect(has, String(score)).toBe(!(NO_CHECKOUT as readonly number[]).includes(score));
    }
  });

  it('respects the darts left and the favourite double', () => {
    expect(checkoutRoutes(100, 1)).toEqual([]);
    expect(labels(checkoutRoutes(35, 3)[0]!)).toBe('3 D16');
    expect(labels(checkoutRoutes(35, 3, 'double', 8)[0]!)).toBe('19 D8');
    expect(labels(checkoutRoutes(7, 1, 'single')[0]!)).toBe('7');
    expect(checkoutRoutes(1, 3)).toEqual([]);
  });
});

describe('setup shots', () => {
  it('scores when far away, sets up a double when close', () => {
    expect(setupRoutes(400, 3)[0]!.kind).toBe('score');
    const setup = setupRoutes(169, 3);
    expect(setup[0]!.kind).toBe('setup');
    expect(x01Suggestions(100, 1, 'double')[0]!.kind).toBe('setup');
  });
});

describe('suggestions per game', () => {
  const seats: Seat[] = [
    { id: 1, name: 'A', number: 5 },
    { id: 2, name: 'B', number: 17 },
  ];

  it('updates with the darts already thrown in the visit', () => {
    const s = play({ type: 'x01', options: normalizeOptions('x01', { start: 101 }), seats }, []);
    const after = preview(s, d('T20'));
    expect(labels(suggestions(after.state, d('T20'))[0]!.darts)).toBe('1 D20');
  });

  it('asks for the missing parts of a Shanghai', () => {
    const s = play({ type: 'shanghai', options: normalizeOptions('shanghai', {}), seats }, []);
    const after = preview(s, d('T1'));
    expect(suggestions(after.state, d('T1'))[0]!.darts.map(dartLabel)).toEqual(['D1', '1']);
  });

  it('tells a Killer to hit their double first', () => {
    const s = play({ type: 'killer', options: normalizeOptions('killer', {}), seats }, []);
    expect(suggestions(s)[0]!.darts.map(dartLabel)).toEqual(['D5']);
  });

  it('closes what the rival scores on in Cricket', () => {
    const s = play({ type: 'cricket', options: normalizeOptions('cricket', {}), seats }, [
      { playerId: 1, darts: d('T20', 'T20', '0') },
    ]);
    const first = suggestions(s)[0]!;
    expect(first.why).toBe('close');
    expect(first.darts[0]).toEqual({ n: 20, m: 3 });
  });
});
