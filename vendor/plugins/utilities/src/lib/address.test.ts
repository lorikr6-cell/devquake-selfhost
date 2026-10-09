import { describe, expect, it } from 'vitest';
import {
  COUNTRY_CODES,
  countries,
  countryName,
  formatAddress,
  isCountryCode,
  photonUrl,
  suggestionsFrom,
} from './address';

describe('countries', () => {
  it('has unique two-letter codes with names in the page language', () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    expect(COUNTRY_CODES.every((c) => /^[A-Z]{2}$/.test(c))).toBe(true);
    expect(countryName('RO', 'ro-RO')).toBe('România');
    expect(countryName('HU', 'de-DE')).toBe('Ungarn');
    expect(isCountryCode('RO')).toBe(true);
    expect(isCountryCode('XX')).toBe(false);
    const list = countries('en-GB');
    expect(list).toHaveLength(COUNTRY_CODES.length);
    expect(list.findIndex((c) => c.code === 'AT')).toBeLessThan(
      list.findIndex((c) => c.code === 'RO'),
    );
  });
});

describe('formatAddress', () => {
  const parts = {
    countryCode: 'RO',
    state: 'Cluj',
    city: 'Cluj-Napoca',
    street: 'Strada Memorandumului',
    houseNumber: '12',
    apartment: '3',
  };

  it('writes the address on one line', () => {
    expect(formatAddress(parts, 'Romania')).toBe(
      'Strada Memorandumului 12, ap. 3, Cluj-Napoca, Cluj, Romania',
    );
    expect(formatAddress({ ...parts, apartment: null }, 'Rumänien', 'Whg.')).toBe(
      'Strada Memorandumului 12, Cluj-Napoca, Cluj, Rumänien',
    );
  });
});

describe('Photon suggestions', () => {
  it('asks Photon in the right country and layers, streets with their city', () => {
    const url = new URL(
      photonUrl({ field: 'street', q: 'Memo', countryCode: 'RO', city: 'Cluj-Napoca' }),
    );
    expect(url.searchParams.get('q')).toBe('Memo Cluj-Napoca');
    expect(url.searchParams.get('countrycode')).toBe('RO');
    expect(url.searchParams.getAll('layer')).toEqual(['street']);
    expect(url.searchParams.has('lang')).toBe(false);
    const state = new URL(photonUrl({ field: 'state', q: 'Clu', countryCode: 'RO' }));
    expect(state.searchParams.getAll('layer')).toEqual(['state', 'county']);
  });

  it('keeps names in the country, state and city, without duplicates', () => {
    const answer = {
      features: [
        { properties: { name: 'Florești', county: 'Alba', countrycode: 'RO' } },
        { properties: { name: 'Florești', county: 'Cluj', countrycode: 'RO' } },
        { properties: { name: 'Floresti', county: 'Cluj', countrycode: 'RO' } },
        { properties: { name: 'Florida', state: 'Florida', countrycode: 'US' } },
        { properties: { name: 'Cluj-Napoca', county: 'Cluj', countrycode: 'RO' } },
      ],
    };
    expect(
      suggestionsFrom(answer, { field: 'city', q: 'Flore', countryCode: 'RO', state: 'cluj' }),
    ).toEqual(['Florești', 'Cluj-Napoca']);
    expect(suggestionsFrom(null, { field: 'city', q: 'x', countryCode: 'RO' })).toEqual([]);
  });

  it('filters streets to the city', () => {
    const answer = {
      features: [
        { properties: { name: 'Strada Memorandumului', city: 'Cluj-Napoca', countrycode: 'RO' } },
        { properties: { name: 'Strada Memorandumului', city: 'Bistrița', countrycode: 'RO' } },
        { properties: { name: 'Piața Memorandumului', city: 'Târgu Mureș', countrycode: 'RO' } },
      ],
    };
    expect(
      suggestionsFrom(answer, {
        field: 'street',
        q: 'Str',
        countryCode: 'RO',
        city: 'Cluj-Napoca',
      }),
    ).toEqual(['Strada Memorandumului']);
  });
});
