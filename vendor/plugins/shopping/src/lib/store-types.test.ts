import { describe, expect, it } from 'vitest';
import {
  KNOWN_STORES,
  STORE_TYPES,
  guessStoreType,
  isStoreType,
  storeType,
  storeTypesByCategory,
} from './store-types';

describe('store type catalogue', () => {
  it('has unique codes that fit the database column', () => {
    const codes = STORE_TYPES.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code.length).toBeLessThanOrEqual(30);
  });

  it('maps every known chain to an existing type', () => {
    for (const s of KNOWN_STORES) expect(isStoreType(s.type)).toBe(true);
  });

  it('groups types by category in catalogue order', () => {
    const groups = storeTypesByCategory();
    expect(groups[0]!.category).toBe('Food and daily essentials');
    expect(groups.flatMap((g) => g.types)).toHaveLength(STORE_TYPES.length);
  });

  it('falls back to "other" for unknown codes', () => {
    expect(storeType('nope').code).toBe('other');
    expect(storeType(null).code).toBe('other');
    expect(isStoreType('nope')).toBe(false);
  });
});

describe('guessStoreType', () => {
  it('recognises well-known chains, with or without a branch name', () => {
    expect(guessStoreType('Kaufland')).toBe('grocery');
    expect(guessStoreType('  kaufland Iulius ')).toBe('grocery');
    expect(guessStoreType('Dedeman')).toBe('hardware_diy');
    expect(guessStoreType('Leroy Merlin Baneasa')).toBe('hardware_diy');
    expect(guessStoreType('ALTEX')).toBe('electronics');
    expect(guessStoreType('Catena')).toBe('pharmacy');
  });

  it('does not guess from partial words or unknown names', () => {
    expect(guessStoreType('Profitabil')).toBeNull();
    expect(guessStoreType('Corner shop')).toBeNull();
    expect(guessStoreType('')).toBeNull();
  });
});
