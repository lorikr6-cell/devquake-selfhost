import { describe, expect, it } from 'vitest';
import { STORE_TYPES } from './store-types';
import {
  NEARBY_LIMIT,
  distanceMeters,
  WIDER_RADIUS_M,
  overpassQuery,
  placeQuery,
  pointFromPhoton,
  searchPoint,
  storesFromOverpass,
} from './nearby-rules';

const HERE = { lat: 45.7537, lon: 21.2257 }; // Timișoara, Piața Victoriei

describe('searchPoint', () => {
  it('rounds the position to about 100 m', () => {
    expect(searchPoint(45.753712, 21.225734)).toEqual({ lat: 45.754, lon: 21.226 });
  });

  it.each([
    [91, 0],
    [0, 181],
    ['45', 21],
    [Number.NaN, 21],
  ])('refuses %j, %j', (lat, lon) => {
    expect(searchPoint(lat, lon)).toBeNull();
  });
});

describe('distanceMeters', () => {
  it('measures a straight line', () => {
    // About 1.11 km per 0.01° of latitude.
    expect(distanceMeters(45.75, 21.22, 45.76, 21.22)).toBeGreaterThan(1100);
    expect(distanceMeters(45.75, 21.22, 45.76, 21.22)).toBeLessThan(1120);
    expect(distanceMeters(45.75, 21.22, 45.75, 21.22)).toBe(0);
  });
});

describe('overpassQuery', () => {
  it('asks for named shops around the point, nodes and buildings', () => {
    const q = overpassQuery(HERE.lat, HERE.lon);
    expect(q).toContain(`around:2000,${HERE.lat},${HERE.lon}`);
    expect(q).toContain('node["shop"');
    expect(q).toContain('way["shop"');
    expect(q).toContain('["name"]');
  });
});

describe('storesFromOverpass', () => {
  const near = { lat: HERE.lat + 0.001, lon: HERE.lon };
  const far = { lat: HERE.lat + 0.01, lon: HERE.lon };
  const data = {
    elements: [
      { ...far, tags: { shop: 'doityourself', name: 'Dedeman', 'addr:city': 'Timișoara' } },
      {
        ...near,
        tags: {
          shop: 'supermarket',
          name: 'Lidl',
          'addr:street': 'Strada Mărășești',
          'addr:housenumber': '5',
        },
      },
      { center: far, tags: { shop: 'mall', name: 'Iulius Town' } },
      {
        ...near,
        tags: {
          shop: 'supermarket',
          name: 'Lidl',
          'addr:street': 'Strada Mărășești',
          'addr:housenumber': '5',
        },
      },
      { ...near, tags: { shop: 'tattoo', name: 'Ink' } },
      { ...near, tags: { shop: 'bakery' } },
    ],
  };

  it('keeps known, named shops once, nearest first, with their type and address', () => {
    const stores = storesFromOverpass(data, HERE.lat, HERE.lon);
    expect(stores.map((s) => s.name)).toEqual(['Lidl', 'Dedeman', 'Iulius Town']);
    expect(stores[0]).toMatchObject({
      type: 'grocery',
      location: 'Strada Mărășești 5',
    });
    expect(stores[1]).toMatchObject({ type: 'hardware_diy', location: 'Timișoara' });
    expect(stores[2]).toMatchObject({ type: 'department', location: null });
  });

  it('only offers store types the app knows', () => {
    const codes = new Set(STORE_TYPES.map((t) => t.code));
    for (const s of storesFromOverpass(data, HERE.lat, HERE.lon)) {
      expect(codes.has(s.type)).toBe(true);
    }
  });

  it('caps the list and survives a broken answer', () => {
    const many = {
      elements: Array.from({ length: 50 }, (_, i) => ({
        lat: HERE.lat + i * 0.0001,
        lon: HERE.lon,
        tags: { shop: 'convenience', name: `Shop ${i}` },
      })),
    };
    expect(storesFromOverpass(many, HERE.lat, HERE.lon)).toHaveLength(NEARBY_LIMIT);
    expect(storesFromOverpass(null, HERE.lat, HERE.lon)).toEqual([]);
    expect(storesFromOverpass({ elements: 'x' }, HERE.lat, HERE.lon)).toEqual([]);
  });
});

describe('searching near a typed place', () => {
  it('accepts a sensible place and reads Photon’s first point', () => {
    expect(placeQuery('  Cluj-Napoca  ')).toBe('Cluj-Napoca');
    expect(placeQuery('x')).toBeNull();
    expect(placeQuery(42)).toBeNull();
    expect(
      pointFromPhoton({ features: [{ geometry: { coordinates: [23.623635, 46.770439] } }] }),
    ).toEqual({ lat: 46.77, lon: 23.624 });
    expect(pointFromPhoton({ features: [] })).toBeNull();
    expect(pointFromPhoton(null)).toBeNull();
  });

  it('can search a wider circle', () => {
    expect(overpassQuery(HERE.lat, HERE.lon, WIDER_RADIUS_M)).toContain(
      `around:${WIDER_RADIUS_M},`,
    );
  });
});
