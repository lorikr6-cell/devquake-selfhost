import { describe, expect, it } from 'vitest';
import { BILL_CODE, TABLE_CODE, billTotals, netOf, newCode, tipFor } from './bill';
import type { TipSettings } from './model';

const percent: TipSettings = { tipMode: 'percent', tipPercents: [1500, 2000], tipFixedMinor: 0 };

describe('a bill', () => {
  it('takes the VAT out of prices that include it', () => {
    expect(netOf(1270, 2700)).toBe(1000);
    expect(netOf(1100, 1000)).toBe(1000);
  });

  it('adds up the lines by VAT rate, with what is still to bring', () => {
    const t = billTotals(
      [
        { priceMinor: 1270, vatRate: 2700, qty: 2, delivered: 2 },
        { priceMinor: 1050, vatRate: 500, qty: 1, delivered: 0 },
      ],
      percent,
      { percent: null, fixed: false },
    );
    expect(t).toEqual({
      gross: 3590,
      net: 3000,
      vat: [
        { rate: 2700, net: 2000, vat: 540 },
        { rate: 500, net: 1000, vat: 50 },
      ],
      tip: 0,
      total: 3590,
      pending: 1,
    });
  });

  it('counts the tip on the bill before VAT, as the owner set it up', () => {
    expect(tipFor(3000, percent, { percent: 1500, fixed: false })).toBe(450);
    expect(tipFor(3000, percent, { percent: 2500, fixed: false })).toBe(0);
    expect(tipFor(3000, { ...percent, tipMode: 'off' }, { percent: 1500, fixed: false })).toBe(0);
    const fixed = { ...percent, tipMode: 'fixed' as const, tipFixedMinor: 500 };
    expect(tipFor(3000, fixed, { percent: null, fixed: true })).toBe(500);
    expect(tipFor(3000, fixed, { percent: null, fixed: false })).toBe(0);
  });

  it('makes codes without look-alike characters', () => {
    let n = 0;
    const code = newCode(12, (max) => n++ % max);
    expect(code).toMatch(BILL_CODE);
    expect(code).not.toMatch(/[01lIoO]/);
    expect(newCode(10, () => 0)).toMatch(TABLE_CODE);
  });
});
