import { describe, expect, it } from 'vitest';
import { CATEGORIES } from './model';
import {
  SUGGESTION_COUNTRIES,
  hasRegionalProviders,
  regionKey,
  regionName,
  regionNames,
  suggestionsFor,
} from './provider-catalog';

const providersOf = (country: string, region: string | null, category: string) =>
  suggestionsFor(country, region)?.services.find((s) => s.category === category)?.providers ?? [];

describe('regionKey', () => {
  it('compares county names however they are written', () => {
    expect(regionKey('Județul Timiș')).toBe(regionKey('Timis'));
    expect(regionKey('Timiș County')).toBe(regionKey('timiș'));
    expect(regionKey('Caraș-Severin')).toBe(regionKey('Caras Severin'));
    expect(regionKey('Municipiul București')).toBe(regionKey('Bucuresti'));
    expect(regionKey('Sector 3')).toBe('');
  });
});

describe('suggestionsFor', () => {
  it('puts the region’s own providers first in Romania', () => {
    expect(providersOf('RO', 'Timiș', 'electricity')[0]).toBe('PPC Energie');
    expect(providersOf('RO', 'Cluj', 'electricity')[0]).toBe('Electrica Furnizare');
    expect(providersOf('RO', 'Iași', 'electricity')[0]).toBe('E.ON Energie România');
    expect(providersOf('RO', 'Timiș', 'water')).toEqual(['Aquatim']);
    expect(providersOf('RO', 'București', 'gas')[0]).toBe('Engie România');
    expect(providersOf('RO', 'Cluj', 'gas')[0]).toBe('E.ON Energie România');
  });

  it('still suggests national providers for an unknown or missing region, without repeats', () => {
    const anywhere = providersOf('RO', null, 'electricity');
    expect(anywhere).toContain('Hidroelectrica');
    expect(new Set(providersOf('RO', 'Dolj', 'electricity')).size).toBe(
      providersOf('RO', 'Dolj', 'electricity').length,
    );
    expect(providersOf('RO', 'Atlantis', 'internet')).toEqual(['Digi', 'Orange', 'Vodafone']);
    expect(providersOf('RO', 'Atlantis', 'water')).toEqual([]);
  });

  it('ticks the usual services and uses the country’s currency', () => {
    const ro = suggestionsFor('ro', 'Timiș')!;
    expect(ro.currency).toBe('RON');
    expect(ro.services.filter((s) => s.usual).map((s) => s.category)).toEqual([
      'electricity',
      'gas',
      'water',
      'internet',
    ]);
    expect(suggestionsFor('HU', 'Budapest')!.currency).toBe('HUF');
    expect(providersOf('HU', 'Budapest', 'water')).toEqual(['Fővárosi Vízművek']);
    expect(providersOf('DE', 'Berlin', 'water')).toEqual(['Berliner Wasserbetriebe', 'Stadtwerke']);
  });

  it('has nothing for countries without a list', () => {
    expect(suggestionsFor('FR', 'Île-de-France')).toBeNull();
  });

  it('only suggests known categories, each with at least one provider', () => {
    const codes = new Set(CATEGORIES.map((c) => c.code));
    for (const country of SUGGESTION_COUNTRIES) {
      for (const s of suggestionsFor(country, null)!.services) {
        expect(codes.has(s.category)).toBe(true);
        expect(s.providers.length).toBeGreaterThan(0);
        for (const p of s.providers) expect(p.length).toBeLessThanOrEqual(80);
      }
    }
  });
});

describe('regionNames', () => {
  it('offers every Romanian county and Bucharest, written properly', () => {
    expect(regionNames('ro')).toHaveLength(42);
    expect(regionName('RO', 'Judetul Timis')).toBe('Timiș');
    expect(regionName('RO', 'Atlantis')).toBe('Atlantis');
    expect(regionNames('FR')).toEqual([]);
  });

  it('has regional providers for every Romanian county offered in the form', () => {
    for (const name of regionNames('RO')) {
      expect(hasRegionalProviders('RO', name), name).toBe(true);
    }
  });
});
