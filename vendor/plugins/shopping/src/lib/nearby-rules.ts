// "Search for nearby stores": what OpenStreetMap knows about shops around a place, turned into
// this app's stores. Pure (no network), so it is tested; lib/nearby.ts asks Overpass.

/** How far around the person to look, in metres. */
export const NEARBY_RADIUS_M = 2000;
/** Searched next when fewer than NEARBY_ENOUGH stores are within NEARBY_RADIUS_M. */
export const WIDER_RADIUS_M = 6000;
export const NEARBY_ENOUGH = 3;
/** At most this many stores are offered. */
export const NEARBY_LIMIT = 30;

/** OpenStreetMap `shop=*` values worth offering, by this app's store type (lib/store-types.ts). */
const OSM_SHOP_TYPES: Record<string, string> = {
  supermarket: 'grocery',
  wholesale: 'grocery',
  greengrocer: 'specialty_food',
  bakery: 'specialty_food',
  butcher: 'specialty_food',
  cheese: 'specialty_food',
  seafood: 'specialty_food',
  deli: 'specialty_food',
  pastry: 'specialty_food',
  beverages: 'specialty_food',
  convenience: 'convenience',
  kiosk: 'convenience',
  hardware: 'hardware_diy',
  doityourself: 'hardware_diy',
  paint: 'hardware_diy',
  trade: 'hardware_diy',
  garden_centre: 'garden',
  electronics: 'electronics',
  computer: 'electronics',
  mobile_phone: 'electronics',
  appliance: 'appliances',
  clothes: 'fashion',
  shoes: 'fashion',
  department_store: 'department',
  mall: 'department',
  variety_store: 'department',
  chemist: 'pharmacy',
  medical_supply: 'pharmacy',
  cosmetics: 'beauty',
  perfumery: 'beauty',
};

/** The shop values asked from Overpass (one regular expression). */
export const OSM_SHOP_PATTERN = Object.keys(OSM_SHOP_TYPES).join('|');

export interface NearbyStore {
  name: string;
  /** A store type code of lib/store-types.ts. */
  type: string;
  /** Street and number, and the town when known; null when OpenStreetMap has no address. */
  location: string | null;
  /** Straight-line distance from the person, in metres. */
  distanceM: number;
  /** OpenStreetMap's brand, its Wikidata id and website, to find the logo (ADR 0052). */
  brand?: string;
  wikidata?: string;
  website?: string;
}

/** Straight-line distance between two points, in metres (haversine). */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/** A position worth searching around: real coordinates, rounded to about 100 m (privacy). */
export function searchPoint(lat: unknown, lon: unknown): { lat: number; lon: number } | null {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return { lat: round(lat), lon: round(lon) };
}

/** The Overpass QL query for shops with a name around a point. */
export function overpassQuery(lat: number, lon: number, radiusM = NEARBY_RADIUS_M): string {
  const around = `around:${radiusM},${lat},${lon}`;
  return `[out:json][timeout:20];
(
  node["shop"~"^(${OSM_SHOP_PATTERN})$"]["name"](${around});
  way["shop"~"^(${OSM_SHOP_PATTERN})$"]["name"](${around});
);
out center tags 200;`;
}

interface OsmElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function addressOf(tags: Record<string, string>): string | null {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const town = tags['addr:city'] ?? tags['addr:place'] ?? '';
  const text = [street, town].filter(Boolean).join(', ');
  return text ? text.slice(0, 160) : null;
}

/**
 * Overpass's answer as stores: known shop kinds with a name, nearest first, one per name and
 * address, at most NEARBY_LIMIT.
 */
export function storesFromOverpass(data: unknown, lat: number, lon: number): NearbyStore[] {
  const elements =
    data && typeof data === 'object' && Array.isArray((data as { elements?: unknown }).elements)
      ? ((data as { elements: OsmElement[] }).elements ?? [])
      : [];
  const seen = new Set<string>();
  const stores: NearbyStore[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const type = OSM_SHOP_TYPES[tags.shop ?? ''];
    const name = (tags.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const point = el.center ?? (el.lat !== undefined && el.lon !== undefined ? el : null);
    if (!type || !name || !point || point.lat === undefined || point.lon === undefined) continue;
    const location = addressOf(tags);
    const key = `${name.toLowerCase()}|${location ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    stores.push({
      name,
      type,
      location,
      distanceM: distanceMeters(lat, lon, point.lat, point.lon),
      ...(tags.brand ? { brand: tags.brand.slice(0, 80) } : {}),
      ...(tags['brand:wikidata'] ? { wikidata: tags['brand:wikidata'] } : {}),
      ...(tags.website || tags['contact:website']
        ? { website: (tags.website ?? tags['contact:website'])!.slice(0, 250) }
        : {}),
    });
  }
  return stores.sort((a, b) => a.distanceM - b.distanceM).slice(0, NEARBY_LIMIT);
}

/** A place typed instead of sharing the location ("Cluj-Napoca", "Main Street 1, Berlin"). */
export function placeQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length >= 2 && text.length <= 120 ? text : null;
}

/** The point of Photon's first result (GeoJSON: [lon, lat]), rounded like a shared location. */
export function pointFromPhoton(data: unknown): { lat: number; lon: number } | null {
  const features = (data as { features?: Array<{ geometry?: { coordinates?: unknown } }> } | null)
    ?.features;
  const coords = Array.isArray(features) ? features[0]?.geometry?.coordinates : null;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return searchPoint(coords[1], coords[0]);
}
