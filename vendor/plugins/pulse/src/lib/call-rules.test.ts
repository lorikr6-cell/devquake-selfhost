import { describe, expect, it } from 'vitest';
import { apiRoute, compactCount, parseCleanupDays } from './call-rules';

describe('compactCount', () => {
  it('shortens large numbers to K, M and B', () => {
    expect(compactCount(950, 'en-US')).toBe('950');
    expect(compactCount(1000, 'en-US')).toBe('1K');
    expect(compactCount(1234, 'en-US')).toBe('1.2K');
    expect(compactCount(1999, 'en-US')).toBe('1.9K');
    expect(compactCount(100_000, 'en-US')).toBe('100K');
    expect(compactCount(999_999, 'en-US')).toBe('999K');
    expect(compactCount(3_450_000, 'en-US')).toBe('3.4M');
    expect(compactCount(1_100_000_000, 'en-US')).toBe('1.1B');
  });

  it('uses the page language’s decimal mark', () => {
    expect(compactCount(1234, 'de-DE')).toBe('1,2K');
    expect(compactCount(-5, 'en-US')).toBe('0');
  });
});

describe('parseCleanupDays', () => {
  it('accepts only the offered intervals', () => {
    expect(parseCleanupDays('30')).toBe(30);
    expect(parseCleanupDays(0)).toBe(0);
    expect(parseCleanupDays('5')).toBeNull();
    expect(parseCleanupDays('')).toBeNull();
    expect(parseCleanupDays(null)).toBeNull();
  });
});

describe('apiRoute', () => {
  it('keeps the developer API path only', () => {
    expect(apiRoute('https://pulse.devquake.com/plugin-api/pulse/v1/events?x=1')).toBe(
      '/v1/events',
    );
    expect(apiRoute('https://pulse.devquake.com/api/v1/poll')).toBe('/v1/poll');
  });
});
