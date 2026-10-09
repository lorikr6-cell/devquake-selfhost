import { isCountryCode } from './address';

/**
 * Where a position is: its country and county / state, from OpenStreetMap through Photon's
 * reverse geocoding (the service the profile's address suggestions already use). The position
 * is only passed on, rounded to about 100 m, and never stored. Null when Photon cannot tell.
 */
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';

/** A position worth looking up: real coordinates, rounded to about 100 m (privacy). */
export function searchPoint(lat: unknown, lon: unknown): { lat: number; lon: number } | null {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return { lat: round(lat), lon: round(lon) };
}

export interface Place {
  countryCode: string;
  /** County or state; null when unknown. */
  region: string | null;
}

/** Photon's answer as a place (pure, tested). */
export function placeFromPhoton(data: unknown): Place | null {
  const feature = (data as { features?: Array<{ properties?: Record<string, unknown> }> } | null)
    ?.features?.[0];
  const p = feature?.properties ?? {};
  const code = typeof p.countrycode === 'string' ? p.countrycode.toUpperCase() : '';
  if (!isCountryCode(code)) return null;
  const pick = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : null);
  // Romanian counties and German Länder are Photon's "state"; some countries only have "county".
  return { countryCode: code, region: pick(p.state) ?? pick(p.county) };
}

export async function placeOf(point: { lat: number; lon: number }): Promise<Place | null> {
  const url = `${PHOTON_REVERSE_URL}?${new URLSearchParams({
    lat: String(point.lat),
    lon: String(point.lon),
    limit: '1',
  })}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DevQuake-Utilities (https://utilities.devquake.com)' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return placeFromPhoton(await res.json());
  } catch {
    return null;
  }
}
