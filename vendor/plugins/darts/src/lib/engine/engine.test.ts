import { describe, expect, it } from 'vitest';
import { parseDart, type Dart } from './darts';
import { EngineError, play, preview, type GameSetup, type Seat, type Visit } from './engine';
import { normalizeOptions, type GameType, type OptionsByType } from './games';

const d = (...labels: string[]): Dart[] => labels.map((l) => parseDart(l)!);
const seats = (n: number): Seat[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `P${i + 1}`, number: null }));

function setup<T extends GameType>(
  type: T,
  options: Partial<OptionsByType[T]> = {},
  players = 2,
): GameSetup<T> {
  return { type, options: { ...normalizeOptions(type, {}), ...options }, seats: seats(players) };
}

/** Visits alternating between players 1..n, starting with player 1. */
function turns(n: number, ...visits: Dart[][]): Visit[] {
  return visits.map((darts, i) => ({ playerId: (i % n) + 1, darts }));
}

function refuses(fn: () => unknown, code: string) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(EngineError);
    expect((err as EngineError).code).toBe(code);
    return;
  }
  throw new Error(`expected EngineError ${code}`);
}

describe('X01', () => {
  it('counts down and finishes on a double', () => {
    const s = play(setup('x01', { start: 101 }), turns(2, d('T20', '1', 'D20')));
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(1);
    expect(s.visits[0]!.scored).toBe(101);
  });

  it('busts below zero, on 1, and on zero without a double', () => {
    for (const darts of [d('T20', 'T20'), d('T20', '20', '20'), d('T20', 'T7', '20')]) {
      const s = play(setup('x01', { start: 101 }), turns(2, darts));
      expect(s.players[0]!.score).toBe(101);
      expect(s.visits[0]!.events).toContain('bust');
      expect(s.visits[0]!.scored).toBe(0);
      expect(s.current).toBe(2);
    }
  });

  it('ends the visit at a bust (no more darts)', () => {
    refuses(() => play(setup('x01', { start: 101 }), turns(2, d('T20', 'T20', '0'))), 'visitOver');
  });

  it('allows a short visit only when it ended early', () => {
    const s = play(setup('x01', { start: 41 }), turns(2, d('1', 'D20')));
    expect(s.finished).toBe(true);
    refuses(() => play(setup('x01'), turns(2, d('T20', 'T20'))), 'threeDarts');
  });

  it('needs a double to start with double-in', () => {
    const s = play(setup('x01', { in: 'double' }), turns(2, d('T20', 'D10', 'T20')));
    expect(s.players[0]!.score).toBe(501 - 80);
    expect(s.players[0]!.opened).toBe(true);
  });

  it('finishes on a treble with master-out, anything with single-out', () => {
    expect(
      play(setup('x01', { start: 120, out: 'master' }), turns(2, d('T20', 'T20'))).winner,
    ).toBe(1);
    const double = play(setup('x01', { start: 120 }), turns(2, d('T20', 'T20')));
    expect(double.visits[0]!.events).toContain('bust');
    expect(play(setup('x01', { start: 61, out: 'single' }), turns(2, d('T20', '1'))).winner).toBe(
      1,
    );
  });

  it('plays legs, rotating who starts', () => {
    const o = { start: 101, legs: 2 };
    const leg1 = turns(2, d('T20', '1', 'D20'));
    const s = play(setup('x01', o), leg1);
    expect(s.finished).toBe(false);
    expect(s.leg).toBe(2);
    expect(s.players[0]!.legs).toBe(1);
    expect(s.players[0]!.score).toBe(101);
    // Player 2 starts leg 2.
    expect(s.current).toBe(2);
    refuses(
      () => play(setup('x01', o), [...leg1, { playerId: 1, darts: d('0', '0', '0') }]),
      'notYourTurn',
    );
    const won = play(setup('x01', o), [
      ...leg1,
      { playerId: 2, darts: d('0', '0', '0') },
      { playerId: 1, darts: d('T20', '1', 'D20') },
    ]);
    expect(won.winner).toBe(1);
  });

  it('marks pure scoring visits for averages', () => {
    const s = play(setup('x01'), turns(2, d('T20', 'T20', 'T20')));
    expect(s.visits[0]!.scoring).toBe(true);
    expect(s.visits[0]!.before).toBe(501);
  });

  it('logs the aimed double on a finish', () => {
    const s = play(setup('x01', { start: 101 }), turns(2, d('T20', '1', 'D20')));
    expect(s.visits[0]!.aims).toEqual([null, null, { n: 20, m: 2 }]);
  });
});

describe('Cricket', () => {
  it('closes numbers with three marks and scores while a rival is open', () => {
    const s = play(setup('cricket'), turns(2, d('T20', 'T20', 'D19')));
    expect(s.players[0]!.marks[20]).toBe(6);
    expect(s.players[0]!.score).toBe(60);
    expect(s.players[0]!.marks[19]).toBe(2);
  });

  it('wins when everything is closed with at least equal points', () => {
    const s = play(
      setup('cricket', {}, 1),
      [d('T20', 'T19', 'T18'), d('T17', 'T16', 'T15'), d('25', 'BULL')].map((darts) => ({
        playerId: 1,
        darts,
      })),
    );
    expect(s.finished).toBe(true);
  });

  it('gives the points to the rivals in cut-throat', () => {
    const s = play(setup('cricket', { variant: 'cutthroat' }), turns(2, d('T20', 'T20', '0')));
    expect(s.players[0]!.score).toBe(0);
    expect(s.players[1]!.score).toBe(60);
  });
});

describe('Shanghai', () => {
  it('wins instantly with a single, double and treble of the round', () => {
    const s = play(setup('shanghai'), turns(2, d('1', 'D1', 'T1')));
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(1);
    expect(s.visits[0]!.events).toContain('shanghai');
  });

  it('only counts the round number, then the best score wins', () => {
    const visits: Dart[][] = [];
    for (let r = 1; r <= 7; r++) visits.push(d(`T${r}`, '20', '0'), d(String(r), '0', '0'));
    const s = play(setup('shanghai'), turns(2, ...visits));
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(1);
    expect(s.players[0]!.score).toBe(3 * 28);
  });

  it('plays a tie-break on the bull', () => {
    const visits: Dart[][] = [];
    for (let r = 1; r <= 7; r++) visits.push(d(String(r), '0', '0'), d(String(r), '0', '0'));
    const s = play(setup('shanghai'), turns(2, ...visits));
    expect(s.finished).toBe(false);
    const after = play(
      setup('shanghai'),
      turns(2, ...visits, d('BULL', '0', '0'), d('0', '0', '0')),
    );
    expect(after.winner).toBe(1);
  });
});

describe('Around the Clock', () => {
  it('advances on the target and wins on the bull', () => {
    const solo = (darts: Dart[][]) => darts.map((x) => ({ playerId: 1, darts: x }));
    const all: Dart[][] = [];
    const seq = [...Array.from({ length: 20 }, (_, i) => String(i + 1)), '25'];
    for (let i = 0; i < seq.length; i += 3) all.push(d(...seq.slice(i, i + 3)));
    const s = play(setup('atc', {}, 1), solo(all));
    expect(s.finished).toBe(true);
    expect(s.players[0]!.step).toBe(21);
  });

  it('only counts doubles in doubles mode', () => {
    const s = play(setup('atc', { hit: 'doubles' }), turns(2, d('1', 'D1', 'D2')));
    expect(s.players[0]!.step).toBe(2);
  });
});

describe('Killer', () => {
  const killerSetup = (): GameSetup<'killer'> => ({
    type: 'killer',
    options: { lives: 3 },
    seats: [
      { id: 1, name: 'A', number: 5 },
      { id: 2, name: 'B', number: 17 },
      { id: 3, name: 'C', number: 8 },
    ],
  });

  it('becomes a killer on its own double, then takes lives', () => {
    const s = play(killerSetup(), turns(3, d('D5', 'D17', 'D17')));
    expect(s.players[0]!.killer).toBe(true);
    expect(s.players[1]!.score).toBe(1);
  });

  it('skips eliminated players and ends with one left', () => {
    const s = play(killerSetup(), [
      { playerId: 1, darts: d('D5', 'D17', 'D17') },
      { playerId: 2, darts: d('0', '0', '0') },
      { playerId: 3, darts: d('0', '0', '0') },
      { playerId: 1, darts: d('D17', 'D8', 'D8') },
    ]);
    expect(s.players[1]!.out).toBe(true);
    expect(s.current).toBe(3);
    const end = play(killerSetup(), [
      { playerId: 1, darts: d('D5', 'D17', 'D17') },
      { playerId: 2, darts: d('0', '0', '0') },
      { playerId: 3, darts: d('0', '0', '0') },
      { playerId: 1, darts: d('D17', 'D8', 'D8') },
      { playerId: 3, darts: d('0', '0', '0') },
      { playerId: 1, darts: d('D8') },
    ]);
    expect(end.finished).toBe(true);
    expect(end.winner).toBe(1);
  });
});

describe('Count-Up', () => {
  it('adds every dart and ends after the rounds', () => {
    const visits = Array.from({ length: 8 }, () => d('T20', '20', '5'));
    const s = play(
      setup('countup', {}, 1),
      visits.map((x) => ({ playerId: 1, darts: x })),
    );
    expect(s.finished).toBe(true);
    expect(s.players[0]!.score).toBe(8 * 85);
    expect(s.visits.every((v) => v.scoring)).toBe(true);
  });
});

describe('drills', () => {
  it('counts hits per target', () => {
    const s = play(
      setup(
        'targets',
        {
          targets: [
            { n: 20, m: 2 },
            { n: 25, m: 0 },
          ],
          dartsPerTarget: 3,
        },
        1,
      ),
      [d('D20', '20', 'D20'), d('25', 'BULL', '0')].map((x) => ({ playerId: 1, darts: x })),
    );
    expect(s.finished).toBe(true);
    expect(s.players[0]!.score).toBe(4);
    expect(s.visits[1]!.aims[0]).toEqual({ n: 25, m: 0 });
  });

  it('gives each finish a number of visits', () => {
    const o = { finishes: [40, 81], dartsPerFinish: 6 };
    const s = play(setup('checkout', o, 1), [
      { playerId: 1, darts: d('20', 'D10') },
      { playerId: 1, darts: d('T19', 'D10', '0') },
      { playerId: 1, darts: d('T20') },
    ]);
    expect(s.finished).toBe(true);
    expect(s.players[0]!.score).toBe(1);
    expect(s.visits[2]!.events).toEqual(['bust', 'missed']);
  });
});

describe('preview', () => {
  it('shows darts not sent yet without changing the game', () => {
    const s = play(setup('x01', { start: 101 }), []);
    const p = preview(s, d('T20'));
    expect(p.over).toBe(false);
    expect(p.state.players[0]!.score).toBe(41);
    expect(s.players[0]!.score).toBe(101);
    expect(preview(s, d('T20', '1', 'D20')).events).toContain('win');
    refuses(() => preview(s, d('T20', 'T20', 'D20', '0')), 'tooManyDarts');
  });

  it('refuses a finished game', () => {
    const s = play(setup('x01', { start: 101 }), turns(2, d('T20', '1', 'D20')));
    refuses(() => preview(s, d('0')), 'gameOver');
  });
});

describe('score after each visit', () => {
  it('records what the scoreboard shows, also when a visit ends a leg', () => {
    const s = play(
      setup('x01', { start: 101, legs: 2 }),
      turns(2, d('T20', '20', '1'), d('20', '0', '0'), d('T20'), d('0', '0', '0'), d('D10')),
    );
    expect(s.visits.map((v) => v.after)).toEqual([20, 81, 20, 81, 0]);
    expect(s.players[0]!.score).toBe(101);
  });

  it('records points, lives and drill progress', () => {
    expect(play(setup('cricket'), turns(2, d('T20', 'T20', '0'))).visits[0]!.after).toBe(60);
    const drill = play(setup('checkout', { finishes: [40, 81], dartsPerFinish: 3 }, 1), [
      { playerId: 1, darts: d('20', 'D10') },
    ]);
    expect(drill.visits[0]!.after).toBe(0);
  });
});
