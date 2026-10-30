import { describe, expect, it } from 'vitest';
import {
  allergenMask,
  allergensOf,
  checkItem,
  checkPin,
  checkStaff,
  checkTips,
  checkVenue,
  formatMinor,
  parsePrice,
  tipChoices,
} from './model';

describe('the venue', () => {
  it('fills a Hungarian or Romanian venue from its preset', () => {
    expect(checkVenue({ name: ' Café Kék ', country: 'hu' })).toEqual({
      ok: true,
      value: {
        name: 'Café Kék',
        country: 'HU',
        currency: 'HUF',
        vatRates: [2700, 1800, 500],
        decimals: 0,
      },
    });
    expect(checkVenue({ name: 'Bistro', country: 'RO' })).toMatchObject({
      ok: true,
      value: { currency: 'RON', vatRates: [2100, 1100], decimals: 2 },
    });
  });

  it('lets any other country be set up by hand', () => {
    expect(
      checkVenue({ name: 'Bar', country: 'AT', currency: 'eur', vatRates: '20, 10, 13' }),
    ).toEqual({
      ok: true,
      value: {
        name: 'Bar',
        country: 'AT',
        currency: 'EUR',
        vatRates: [2000, 1000, 1300],
        decimals: 2,
      },
    });
    expect(checkVenue({ name: 'Bar', country: 'AT' })).toMatchObject({
      ok: false,
      error: 'currency',
    });
    expect(checkVenue({ name: 'Bar', country: 'AT', currency: 'EUR' })).toMatchObject({
      ok: false,
      error: 'vatRates',
    });
  });

  it('reads prices as people type them, in minor units', () => {
    expect(parsePrice('4.50', 2)).toBe(450);
    expect(parsePrice('4,5', 2)).toBe(450);
    expect(parsePrice('1200', 0)).toBe(1200);
    expect(parsePrice('12.345', 2)).toBeNull();
    expect(parsePrice('-3', 2)).toBeNull();
    expect(formatMinor(450, 2)).toBe('4.50');
    expect(formatMinor(1200, 0)).toBe('1200');
  });

  it('keeps the 14 allergens as a mask', () => {
    const mask = allergenMask(['milk', 'gluten', 'nonsense']);
    expect(allergensOf(mask)).toEqual(['gluten', 'milk']);
  });

  it('checks a menu item against the venue', () => {
    const venue = { decimals: 2, vatRates: [2100, 1100] };
    expect(
      checkItem(
        {
          name: 'Flat white',
          price: '14',
          vatRate: 1100,
          station: 'coffee',
          allergens: ['milk'],
          categoryId: 3,
        },
        venue,
      ),
    ).toEqual({
      ok: true,
      value: {
        categoryId: 3,
        name: 'Flat white',
        description: null,
        priceMinor: 1400,
        vatRate: 1100,
        station: 'coffee',
        allergens: allergenMask(['milk']),
        available: true,
      },
    });
    expect(checkItem({ name: 'X', price: '1', vatRate: 2700 }, venue)).toMatchObject({
      ok: false,
      error: 'vatRate',
    });
  });

  it('accepts only PINs that are not too easy', () => {
    expect(checkPin('4821')).toEqual({ ok: true, value: '4821' });
    expect(checkPin('1234')).toMatchObject({ ok: false, error: 'pinWeak' });
    expect(checkPin('7777')).toMatchObject({ ok: false, error: 'pinWeak' });
    expect(checkPin('12')).toMatchObject({ ok: false, error: 'pin' });
    expect(checkStaff({ name: 'Ana', role: 'waiter' })).toEqual({
      ok: true,
      value: { name: 'Ana', role: 'waiter' },
    });
    expect(checkStaff({ name: 'Ana', role: 'boss' })).toMatchObject({ ok: false, error: 'role' });
  });

  it('keeps the owner’s tip settings: off, percentages before VAT, or a fixed tip', () => {
    expect(checkTips({ tipMode: 'percent', tipPercents: '20, 15, 25, 15' }, 2)).toEqual({
      ok: true,
      value: { tipMode: 'percent', tipPercents: [1500, 2000, 2500], tipFixedMinor: 0 },
    });
    expect(checkTips({ tipMode: 'fixed', tipFixed: '500' }, 0)).toEqual({
      ok: true,
      value: { tipMode: 'fixed', tipPercents: [1500, 2000, 2500], tipFixedMinor: 500 },
    });
    expect(checkTips({ tipMode: 'fixed', tipFixed: '' }, 2)).toMatchObject({
      ok: false,
      error: 'tipFixed',
    });
    expect(checkTips({ tipMode: 'percent', tipPercents: '' }, 2)).toMatchObject({
      ok: false,
      error: 'tipPercents',
    });
    expect(checkTips({ tipMode: 'off' }, 2)).toMatchObject({ ok: true, value: { tipMode: 'off' } });
    expect(checkTips({ tipMode: 'always' }, 2)).toMatchObject({ ok: false, error: 'tipMode' });
  });

  it('offers the tips on the bill before VAT', () => {
    const tips = { tipMode: 'percent' as const, tipPercents: [1500, 2000], tipFixedMinor: 0 };
    expect(tipChoices(4999, tips)).toEqual([
      { percent: 1500, amount: 750 },
      { percent: 2000, amount: 1000 },
    ]);
    expect(tipChoices(4999, { ...tips, tipMode: 'fixed', tipFixedMinor: 300 })).toEqual([
      { percent: null, amount: 300 },
    ]);
    expect(tipChoices(4999, { ...tips, tipMode: 'off' })).toEqual([]);
  });
});
