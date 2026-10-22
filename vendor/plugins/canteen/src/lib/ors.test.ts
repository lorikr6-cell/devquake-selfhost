import { describe, expect, it } from 'vitest';
import { optimisationRequest, orderFrom, positionFrom } from './ors';

describe('OpenRouteService', () => {
  it('asks for one shift from and back to the kitchen, with each window in seconds', () => {
    const req = optimisationRequest(
      [
        { personId: 4, at: [23.6, 46.77], fromMin: 660, toMin: 720 },
        { personId: 9, at: [23.58, 46.75], fromMin: null, toMin: null },
      ],
      [23.59, 46.76],
      { fromMin: 600, toMin: 840 },
    );
    expect(req.vehicles).toEqual([
      {
        id: 1,
        profile: 'driving-car',
        start: [23.59, 46.76],
        end: [23.59, 46.76],
        time_window: [36000, 50400],
      },
    ]);
    expect(req.jobs[0]).toEqual({
      id: 4,
      location: [23.6, 46.77],
      service: 180,
      time_windows: [[39600, 43200]],
    });
    expect(req.jobs[1]).not.toHaveProperty('time_windows');
  });

  it('takes the computed order and puts what could not fit last', () => {
    const answer = {
      routes: [
        {
          steps: [
            { type: 'start' },
            { type: 'job', job: 9 },
            { type: 'job', job: 4 },
            { type: 'end' },
          ],
        },
      ],
      unassigned: [{ id: 7 }],
    };
    expect(orderFrom(answer, [4, 7, 9])).toEqual({ order: [9, 4, 7], unassigned: [7] });
    expect(orderFrom(null, [1, 2])).toEqual({ order: [1, 2], unassigned: [1, 2] });
  });

  it('reads the position of the first match, longitude first', () => {
    expect(positionFrom({ features: [{ geometry: { coordinates: [23.59, 46.77] } }] })).toEqual([
      23.59, 46.77,
    ]);
    expect(positionFrom({ features: [] })).toBeNull();
    expect(positionFrom({ features: [{ geometry: { coordinates: [500, 46] } }] })).toBeNull();
  });
});
