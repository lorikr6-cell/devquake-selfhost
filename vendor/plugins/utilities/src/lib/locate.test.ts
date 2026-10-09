import { describe, expect, it } from 'vitest';
import { placeFromPhoton, searchPoint } from './locate';

describe('searchPoint', () => {
  it('rounds to about 100 m and refuses nonsense', () => {
    expect(searchPoint(45.753712, 21.225734)).toEqual({ lat: 45.754, lon: 21.226 });
    expect(searchPoint(100, 0)).toBeNull();
    expect(searchPoint('45', 21)).toBeNull();
  });
});

describe('placeFromPhoton', () => {
  it('reads the country and the county or state', () => {
    expect(
      placeFromPhoton({
        features: [{ properties: { countrycode: 'ro', state: 'Timiș', city: 'Timișoara' } }],
      }),
    ).toEqual({ countryCode: 'RO', region: 'Timiș' });
    expect(
      placeFromPhoton({ features: [{ properties: { countrycode: 'HU', county: 'Budapest' } }] }),
    ).toEqual({ countryCode: 'HU', region: 'Budapest' });
    expect(placeFromPhoton({ features: [{ properties: { countrycode: 'DE' } }] })).toEqual({
      countryCode: 'DE',
      region: null,
    });
  });

  it('gives up on an empty or broken answer', () => {
    expect(placeFromPhoton({ features: [] })).toBeNull();
    expect(placeFromPhoton(null)).toBeNull();
    expect(placeFromPhoton({ features: [{ properties: { countrycode: 'XX' } }] })).toBeNull();
  });
});
