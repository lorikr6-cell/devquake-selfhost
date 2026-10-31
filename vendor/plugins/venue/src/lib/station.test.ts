import { describe, expect, it } from 'vitest';
import { isStation, minutesSince } from './station';

describe('the station screens', () => {
  it('knows the kitchen, bar and coffee screens only', () => {
    expect(['kitchen', 'bar', 'coffee'].every(isStation)).toBe(true);
    expect(isStation('none')).toBe(false);
    expect(isStation('../admin')).toBe(false);
  });

  it('counts how long a ticket has waited, in whole minutes', () => {
    const now = Date.parse('2026-10-31T12:00:00Z');
    expect(minutesSince('2026-10-31T11:44:30Z', now)).toBe(15);
    expect(minutesSince('2026-10-31T12:05:00Z', now)).toBe(0);
  });
});
