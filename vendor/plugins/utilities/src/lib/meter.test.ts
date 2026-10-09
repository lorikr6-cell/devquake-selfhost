import { describe, expect, it } from 'vitest';
import { consumptionBetween, meterCandidates, pickMeterIndex } from './meter';

describe('meterCandidates', () => {
  it('finds plain, decimal and spaced digit groups', () => {
    expect(meterCandidates('kWh 012345')).toContain(12345);
    expect(meterCandidates('m3 1234,567')).toContain(1234.567);
    expect(meterCandidates('0 1 2 3 4')).toContain(1234);
    expect(meterCandidates('12 ab')).toEqual([]);
  });

  it('reads common OCR mix-ups of O and l as digits', () => {
    expect(meterCandidates('O12l45')).toContain(12145);
  });
});

describe('pickMeterIndex', () => {
  it('picks the smallest value not below the previous reading', () => {
    expect(pickMeterIndex('serial 998877 index 012480 year 2019', 12345)).toBe(12480);
  });

  it('returns null when nothing fits after the previous reading', () => {
    expect(pickMeterIndex('000123', 5000)).toBeNull();
    expect(pickMeterIndex('no digits', null)).toBeNull();
  });

  it('without a previous reading picks the longest number', () => {
    expect(pickMeterIndex('220V 50Hz 0045678', null)).toBe(45678);
  });
});

describe('consumptionBetween', () => {
  it('subtracts and rounds, refusing a lower index', () => {
    expect(consumptionBetween(12345.1, 12400.35)).toBe(55.25);
    expect(consumptionBetween(100, 90)).toBeNull();
  });
});
