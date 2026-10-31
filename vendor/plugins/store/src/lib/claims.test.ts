import { describe, expect, it } from 'vitest';
import {
  CLAIM_CODE_LENGTH,
  checkPackage,
  claimState,
  newClaimCode,
  newClaimToken,
  normalizeCode,
  parseClaimProduct,
  sha256,
} from './claims';

describe('claims', () => {
  it('makes long random tokens and codes that are easy to type', () => {
    expect(newClaimToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const code = newClaimCode();
    expect(code).toHaveLength(CLAIM_CODE_LENGTH);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
    expect(newClaimToken()).not.toBe(newClaimToken());
  });

  it('compares a typed code however it was typed', () => {
    expect(normalizeCode(' ab3d-ef7g ')).toBe('AB3DEF7G');
    expect(sha256(normalizeCode('ab3d ef7g'))).toBe(sha256('AB3DEF7G'));
  });

  it('knows an NPS package from anything else', () => {
    expect(parseClaimProduct('nps:12')).toEqual({ kind: 'nps', id: 12 });
    expect(parseClaimProduct('12')).toBeNull();
    expect(parseClaimProduct('nps:x')).toBeNull();
  });

  it('works out where a claim stands', () => {
    const now = new Date('2026-11-10T00:00:00Z');
    const later = new Date('2026-12-01T00:00:00Z');
    const base = { status: 'open' as const, failed_attempts: 0, expires_at: later };
    expect(claimState(base, now)).toBe('open');
    expect(claimState({ ...base, failed_attempts: 5 }, now)).toBe('locked');
    expect(claimState({ ...base, expires_at: now }, now)).toBe('expired');
    expect(claimState({ ...base, status: 'claimed' }, later)).toBe('claimed');
  });

  it('checks a package: a name and 1 to 100 points', () => {
    expect(checkPackage({ name: ' 10  points ', points: '10' })).toEqual({
      ok: true,
      name: '10 points',
      points: 10,
    });
    expect(checkPackage({ name: 'x', points: 10 })).toEqual({ ok: false, error: 'name' });
    expect(checkPackage({ name: 'Big', points: 101 })).toEqual({ ok: false, error: 'points' });
    expect(checkPackage({ name: 'Half', points: 2.5 })).toEqual({ ok: false, error: 'points' });
  });
});
