import { describe, expect, it } from 'vitest';
import { nearestOrder, shares, sweepAreas, type Point } from './areas';

// A kitchen in the middle and people on four sides of town.
const kitchen = { lat: 46.77, lng: 23.6 };
const at = (id: number, dLat: number, dLng: number): Point => ({
  id,
  lat: kitchen.lat + dLat,
  lng: kitchen.lng + dLng,
});
const north = [at(1, 0.02, 0), at(2, 0.025, 0.002), at(3, 0.03, -0.001)];
const south = [at(4, -0.02, 0), at(5, -0.025, 0.001), at(6, -0.03, -0.002)];

describe('driver areas', () => {
  it('shares people in proportion to how much each driver works', () => {
    expect(
      shares(10, [
        { id: 1, weight: 1 },
        { id: 2, weight: 1 },
      ]),
    ).toEqual([5, 5]);
    expect(
      shares(9, [
        { id: 1, weight: 2 },
        { id: 2, weight: 1 },
      ]),
    ).toEqual([6, 3]);
    expect(
      shares(5, [
        { id: 1, weight: 0 },
        { id: 2, weight: 0 },
      ]),
    ).toEqual([3, 2]);
    expect(shares(4, [])).toEqual([]);
  });

  it('gives each driver one side of town, never mixing them', () => {
    const areas = sweepAreas([...north, ...south], kitchen, [
      { id: 10, weight: 1 },
      { id: 20, weight: 1 },
    ]);
    const northDriver = areas.get(1);
    expect(north.every((p) => areas.get(p.id) === northDriver)).toBe(true);
    expect(south.every((p) => areas.get(p.id) !== northDriver)).toBe(true);
    expect(areas.size).toBe(6);
  });

  it('orders a route from the kitchen to the nearest stop, unknown addresses last', () => {
    const positions = new Map(north.map((p) => [p.id, p]));
    expect(nearestOrder([3, 99, 1, 2], positions, kitchen)).toEqual([1, 2, 3, 99]);
  });
});
