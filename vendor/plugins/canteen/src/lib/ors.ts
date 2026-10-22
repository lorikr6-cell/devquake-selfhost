// OpenRouteService (openrouteservice.org, HeiGIT, Heidelberg): address lookup and the order of
// a route's stops (its optimisation service, VROOM). Only addresses and map positions are sent,
// never names. The request and answer shapes are pure and tested in ors.test.ts.

export const ORS_URL = 'https://api.openrouteservice.org';

/** Seconds a stop takes at the door (the driving comes from the map). */
export const SERVICE_SECONDS = 180;

export type LngLat = [number, number];

export interface OptimiseStop {
  personId: number;
  at: LngLat;
  /** Minutes after midnight; null = any time. */
  fromMin: number | null;
  toMin: number | null;
}

/** The optimisation request: one vehicle (the driver's shift) from and back to the kitchen. */
export function optimisationRequest(
  stops: readonly OptimiseStop[],
  kitchen: LngLat,
  shift: { fromMin: number; toMin: number },
) {
  return {
    jobs: stops.map((s) => ({
      id: s.personId,
      location: s.at,
      service: SERVICE_SECONDS,
      ...(s.fromMin !== null && s.toMin !== null
        ? { time_windows: [[s.fromMin * 60, s.toMin * 60]] }
        : {}),
    })),
    vehicles: [
      {
        id: 1,
        profile: 'driving-car',
        start: kitchen,
        end: kitchen,
        time_window: [shift.fromMin * 60, shift.toMin * 60],
      },
    ],
  };
}

interface OptimisationAnswer {
  routes?: { steps?: { type?: string; job?: number; id?: number }[] }[];
  unassigned?: { id?: number }[];
}

/**
 * The stops in the computed order; people it could not fit in their window or the shift come
 * last, in their old order, and are counted.
 */
export function orderFrom(
  answer: unknown,
  personIds: readonly number[],
): { order: number[]; unassigned: number[] } {
  const a = (answer ?? {}) as OptimisationAnswer;
  const known = new Set(personIds);
  const order: number[] = [];
  for (const step of a.routes?.[0]?.steps ?? []) {
    const id = step.job ?? (step.type === 'job' ? step.id : undefined);
    if (step.type === 'job' && id !== undefined && known.has(id) && !order.includes(id)) {
      order.push(id);
    }
  }
  const unassigned = personIds.filter((id) => !order.includes(id));
  return { order: [...order, ...unassigned], unassigned };
}

/** The first match of an address search, or null. */
export function positionFrom(answer: unknown): LngLat | null {
  const coords = (answer as { features?: { geometry?: { coordinates?: unknown } }[] })
    ?.features?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords.map(Number);
  return Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    Math.abs(lat!) <= 90 &&
    Math.abs(lng!) <= 180
    ? [lng!, lat!]
    : null;
}

export const orsKey = () => process.env.CANTEEN_ORS_KEY?.trim() || null;

async function call(path: string, init: RequestInit): Promise<unknown> {
  const key = orsKey();
  if (!key) throw new Error('CANTEEN_ORS_KEY is not set');
  const res = await fetch(`${ORS_URL}${path}`, {
    ...init,
    headers: { Authorization: key, Accept: 'application/json', ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  if (!res.ok)
    throw Object.assign(new Error(`OpenRouteService ${res.status}`), { status: res.status });
  return res.json();
}

/**
 * Looks an address up. With `near` (the kitchen), results close to it come first: the same
 * street name exists in many towns.
 */
export async function geocode(address: string, near?: LngLat | null): Promise<LngLat | null> {
  const query = new URLSearchParams({ text: address, size: '1' });
  if (near) {
    query.set('focus.point.lon', String(near[0]));
    query.set('focus.point.lat', String(near[1]));
  }
  return positionFrom(await call(`/geocode/search?${query}`, { method: 'GET' }));
}

export async function optimise(request: ReturnType<typeof optimisationRequest>): Promise<unknown> {
  return call('/optimization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}
