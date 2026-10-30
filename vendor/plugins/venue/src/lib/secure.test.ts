import { describe, expect, it } from 'vitest';
import { hashPin, newTabletToken, pinMatches, tokenHash } from './secure';

describe('PINs and tablet tokens', () => {
  it('keeps a PIN only as a salted hash and checks it', () => {
    const stored = hashPin('4821');
    expect(stored).not.toContain('4821');
    expect(pinMatches('4821', stored)).toBe(true);
    expect(pinMatches('4822', stored)).toBe(false);
    expect(pinMatches('4821', null)).toBe(false);
    // The same PIN twice gives different hashes (its own salt each time).
    expect(hashPin('4821')).not.toBe(stored);
  });

  it('makes long random tablet tokens, kept as SHA-256', () => {
    const token = newTabletToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(newTabletToken()).not.toBe(token);
  });
});
