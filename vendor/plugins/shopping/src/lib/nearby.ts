import { HttpError } from './http';
import {
  NEARBY_ENOUGH,
  NEARBY_RADIUS_M,
  WIDER_RADIUS_M,
  overpassQuery,
  pointFromPhoton,
  storesFromOverpass,
  type NearbyStore,
} from './nearby-rules';

/**
 * Asks OpenStreetMap (the public Overpass API) for shops around a point. The point is only
 * passed on, never stored. Overpass is a shared, free service: one search per person every
 * SEARCH_GAP_MS (per server process), a timeout, and an identifying User-Agent (without one,
 * Overpass answers 406). When the main server refuses or is busy, two public mirrors are tried.
 */
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const PHOTON_URL = 'https://photon.komoot.io/api/';
const USER_AGENT = 'DevQuake shopping lists (https://devquake.com; contact@devquake.com)';
const SEARCH_GAP_MS = 10_000;
const lastSearch = new Map<number, number>();

async function overpass(query: string): Promise<unknown> {
  for (const url of OVERPASS_URLS) {
    const host = new URL(url).host;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(20_000),
        cache: 'no-store',
      });
      if (res.ok) {
        const data: unknown = await res.json().catch(() => null);
        if (data) return data;
        console.error(`[shopping] nearby: ${host} answered no JSON`);
      } else {
        console.error(`[shopping] nearby: ${host} answered ${res.status}`);
      }
    } catch (err) {
      console.error(`[shopping] nearby: ${host} failed (${(err as Error).name})`);
    }
  }
  throw new HttpError(503, 'nearbyUnavailable');
}

export async function nearbyStores(
  userId: number,
  point: { lat: number; lon: number },
): Promise<{ stores: NearbyStore[]; radiusM: number }> {
  const now = Date.now();
  if (now - (lastSearch.get(userId) ?? 0) < SEARCH_GAP_MS) {
    throw new HttpError(429, 'nearbyWait');
  }
  lastSearch.set(userId, now);
  if (lastSearch.size > 5000) lastSearch.clear();

  const near = storesFromOverpass(
    await overpass(overpassQuery(point.lat, point.lon)),
    point.lat,
    point.lon,
  );
  if (near.length >= NEARBY_ENOUGH) return { stores: near, radiusM: NEARBY_RADIUS_M };
  // Few shops close by (a village, or little mapped): a wider circle.
  const wide = storesFromOverpass(
    await overpass(overpassQuery(point.lat, point.lon, WIDER_RADIUS_M)),
    point.lat,
    point.lon,
  );
  return wide.length > near.length
    ? { stores: wide, radiusM: WIDER_RADIUS_M }
    : { stores: near, radiusM: NEARBY_RADIUS_M };
}

/** A typed place as a point (Photon, OpenStreetMap search), for people who do not share their location. */
export async function placePoint(place: string): Promise<{ lat: number; lon: number }> {
  const params = new URLSearchParams({ q: place, limit: '1' });
  const res = await fetch(`${PHOTON_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  }).catch((err: Error) => {
    console.error(`[shopping] place search failed (${err.name})`);
    return null;
  });
  if (!res || !res.ok) {
    if (res) console.error(`[shopping] place search answered ${res.status}`);
    throw new HttpError(503, 'nearbyUnavailable');
  }
  const point = pointFromPhoton(await res.json().catch(() => null));
  if (!point) throw new HttpError(404, 'placeNotFound');
  return point;
}
