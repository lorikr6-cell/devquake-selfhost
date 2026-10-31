import { describe, expect, it } from 'vitest';
import { assessmentAnswers, hasPlace, placesLeft, takesPlace } from './social';

describe('social work', () => {
  it('counts places: active and paused people take one, waiting and ended do not', () => {
    expect(['active', 'paused', 'waiting', 'ended'].map((s) => takesPlace(s as never))).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(placesLeft(20, 18)).toBe(2);
    expect(placesLeft(20, 25)).toBe(0);
    expect(placesLeft(null, 99)).toBeNull();
    expect([hasPlace(20, 19), hasPlace(20, 20), hasPlace(null, 1000)]).toEqual([true, false, true]);
  });

  it('keeps known answers of the questionnaire and refuses unknown codes', () => {
    expect(
      assessmentAnswers({ livesWith: 'alone', priority: 'high', health: '  diabetes  ', x: 'y' }),
    ).toEqual({ livesWith: 'alone', priority: 'high', health: 'diabetes' });
    expect(assessmentAnswers({ livesWith: 'castle' })).toBeNull();
    expect(assessmentAnswers({})).toBeNull();
    expect(assessmentAnswers({ notes: 'x'.repeat(3000) })?.notes).toHaveLength(2000);
  });
});
