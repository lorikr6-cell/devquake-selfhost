import { describe, expect, it } from 'vitest';
import { INVITE_CODE_PATTERN, formatMoney, initials, newInviteCode, parseAmount } from './model';

describe('model', () => {
  it('reads amounts with a dot or a comma and at most two decimals', () => {
    expect(parseAmount('12,50')).toBe(12.5);
    expect(parseAmount(' 1 234.5 ')).toBe(1234.5);
    expect(parseAmount(7)).toBe(7);
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-3')).toBeNull();
    expect(parseAmount('1.234')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('10000000')).toBeNull();
  });

  it('makes invite codes without look-alike characters', () => {
    let n = 0;
    const code = newInviteCode((max) => n++ % max);
    expect(code).toMatch(INVITE_CODE_PATTERN);
    expect(code).not.toMatch(/[ILO01]/);
  });

  it('writes initials and money', () => {
    expect(initials('Ana Maria Pop')).toBe('AP');
    expect(initials('bob')).toBe('B');
    expect(initials('  ')).toBe('?');
    expect(formatMoney(1234.5, 'EUR', 'en-GB')).toBe('€1,234.50');
    expect(formatMoney(5, 'XXZ', 'en-GB')).toMatch(/5/);
  });
});
