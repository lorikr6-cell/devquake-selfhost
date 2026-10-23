// Driver areas: each person living at home belongs to one driver's area, so routes built from
// them never overlap. Proposed by a sweep around the kitchen (wedges, like slices of a cake),
// sized to how much each driver works; the organisers then move people between areas by hand.
// Pure: tested in areas.test.ts. Positions are the ones OpenRouteService found for the
// addresses (looked up once, migration 0009).

export interface Point {
  id: number;
  lat: number;
  lng: number;
}

export interface AreaDriver {
  id: number;
  /** How much the driver can carry: days a week × minutes of their shift. */
  weight: number;
}

/** The angle of a point around the centre, in radians (east = 0, counter-clockwise). */
function angle(p: Point, centre: { lat: number; lng: number }): number {
  const x = (p.lng - centre.lng) * Math.cos((centre.lat * Math.PI) / 180);
  const y = p.lat - centre.lat;
  return Math.atan2(y, x);
}

/** The centre of the points (when there is no kitchen position). */
export function centreOf(points: readonly Point[]): { lat: number; lng: number } {
  const n = points.length || 1;
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / n,
    lng: points.reduce((s, p) => s + p.lng, 0) / n,
  };
}

/** How many of `n` people each driver gets, in proportion to their weight (largest remainder). */
export function shares(n: number, drivers: readonly AreaDriver[]): number[] {
  const total = drivers.reduce((s, d) => s + Math.max(0, d.weight), 0);
  if (drivers.length === 0) return [];
  if (total <= 0)
    return shares(
      n,
      drivers.map((d) => ({ ...d, weight: 1 })),
    );
  const exact = drivers.map((d) => (n * Math.max(0, d.weight)) / total);
  const out = exact.map(Math.floor);
  let left = n - out.reduce((s, v) => s + v, 0);
  const order = exact
    .map((v, i) => ({ i, r: v - Math.floor(v) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of order) {
    if (left-- <= 0) break;
    out[i]!++;
  }
  return out;
}

/**
 * Proposes areas: the people sorted by their direction from the centre, starting after the
 * widest empty gap (so no area straddles a crowded street), then cut into consecutive wedges,
 * one per driver, sized by `shares`. Returns person id → driver id.
 */
export function sweepAreas(
  points: readonly Point[],
  centre: { lat: number; lng: number },
  drivers: readonly AreaDriver[],
): Map<number, number> {
  const result = new Map<number, number>();
  if (points.length === 0 || drivers.length === 0) return result;
  const sorted = points
    .map((p) => ({ p, a: angle(p, centre) }))
    .sort((x, y) => x.a - y.a || x.p.id - y.p.id);
  // Start right after the widest gap between neighbouring directions.
  let start = 0;
  let widest = -1;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length]!.a + (i + 1 === sorted.length ? 2 * Math.PI : 0);
    const gap = next - sorted[i]!.a;
    if (gap > widest) {
      widest = gap;
      start = (i + 1) % sorted.length;
    }
  }
  const ring = [...sorted.slice(start), ...sorted.slice(0, start)];
  const counts = shares(ring.length, drivers);
  let at = 0;
  drivers.forEach((d, i) => {
    for (let k = 0; k < counts[i]!; k++) result.set(ring[at++]!.p.id, d.id);
  });
  return result;
}

/** Distance in km between two positions (good enough for ordering stops in a town). */
export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const x = (((b.lng - a.lng) * Math.PI) / 180) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  const y = ((b.lat - a.lat) * Math.PI) / 180;
  return Math.sqrt(x * x + y * y) * 6371;
}

/**
 * An order for a route without a map service: from the kitchen to the nearest stop, then
 * always the nearest next one. People without a position go last, in the order given.
 * "Compute the order from the map" (OpenRouteService) can still refine a day's route.
 */
export function nearestOrder(
  ids: readonly number[],
  positions: ReadonlyMap<number, { lat: number; lng: number }>,
  start: { lat: number; lng: number } | null,
): number[] {
  const located = ids.filter((id) => positions.has(id));
  const unknown = ids.filter((id) => !positions.has(id));
  const out: number[] = [];
  let here = start ?? (located.length ? positions.get(located[0]!)! : null);
  const left = [...located];
  while (left.length && here) {
    let best = 0;
    for (let i = 1; i < left.length; i++) {
      if (km(here, positions.get(left[i]!)!) < km(here, positions.get(left[best]!)!)) best = i;
    }
    const [id] = left.splice(best, 1);
    out.push(id!);
    here = positions.get(id!)!;
  }
  return [...out, ...unknown];
}
