import { describe, expect, it } from 'vitest';
import { arrival, estimate, fitsAtEnd, inWindow, move, routeOk } from './routes';

const any = { fromMin: null, toMin: null };
const w = (from: number, to: number) => ({ fromMin: from, toMin: to });
const shift = { fromMin: 660, toMin: 780 }; // 11:00–13:00

describe('routes', () => {
  it('waits for a window to open, never arrives late', () => {
    expect(arrival(600, w(660, 720))).toBe(660);
    expect(arrival(700, w(660, 720))).toBe(700);
    expect(inWindow(730, w(660, 720))).toBe(false);
    expect(inWindow(730, any)).toBe(true);
  });

  it('estimates each stop one leg after the previous one', () => {
    const timed = estimate(
      [
        { personId: 1, window: any },
        { personId: 2, window: w(720, 750) },
        { personId: 3, window: any },
      ],
      shift,
      15,
    );
    expect(timed.map((t) => t.etaMin)).toEqual([675, 720, 735]);
    expect(routeOk(timed)).toBe(true);
  });

  it('flags a late stop and the end of the shift', () => {
    const late = estimate([{ personId: 1, window: w(600, 650) }], shift, 15);
    expect(late[0]!.inWindow).toBe(false);
    const long = estimate(
      Array.from({ length: 9 }, (_, i) => ({ personId: i, window: any })),
      shift,
      15,
    );
    expect(long.at(-1)!.inShift).toBe(false);
  });

  it('tells where a person still fits', () => {
    const stops = [{ personId: 1, window: any }];
    expect(fitsAtEnd(stops, { personId: 2, window: w(680, 700) }, shift, 15)).toBe(true);
    expect(fitsAtEnd(stops, { personId: 2, window: w(600, 670) }, shift, 15)).toBe(false);
  });

  it('moves a stop', () => {
    expect(move([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
    expect(move([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
  });
});
