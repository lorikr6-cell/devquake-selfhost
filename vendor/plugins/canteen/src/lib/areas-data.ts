import type { PluginDatabase } from '@devquake/plugin-sdk';
import { centreOf, nearestOrder, sweepAreas, type Point } from './areas';
import { requireCan } from './data';
import { addDays, daysBetween, isIsoDate, type IsoDate } from './dates';
import { HttpError } from './http';
import { dayPlan, listDrivers, setRoute, type DayPlan } from './routes-data';

// Driver areas (migration 0018, lib/areas.ts): who belongs to which driver, the proposal from
// the addresses, and building the routes of a span of days from them. Planners only.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v);

/** At most this many days are built or printed at once (a month). */
export const MAX_SPAN_DAYS = 31;
/** Addresses looked up per press of "Find the addresses on the map" (the free key's pace). */
const LOOKUPS_PER_PRESS = 40;

export interface AreaPerson {
  id: number;
  name: string;
  address: string | null;
  areaDriverId: number | null;
  /** The address has a map position (found by OpenRouteService). */
  located: boolean;
}

export interface AreaPlan {
  drivers: { id: number; name: string; weekdays: number[] }[];
  people: AreaPerson[];
  /** OpenRouteService is set up (addresses can be found on the map). */
  mapReady: boolean;
}

interface PersonRow {
  id: number;
  first_name: string;
  last_name: string;
  address: string | null;
  area_driver_id: number | null;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_address: string | null;
}

async function peopleAtHome(db: Db, orgId: number): Promise<PersonRow[]> {
  return db.query<PersonRow>(
    `SELECT id, first_name, last_name, address, area_driver_id, geo_lat, geo_lng, geo_address
       FROM canteen_people
      WHERE org_id = ? AND kind = 'delivery' AND status IN ('active','paused')
      ORDER BY last_name, first_name`,
    [orgId],
  );
}

const located = (r: PersonRow) =>
  r.geo_lat !== null && r.address !== null && r.geo_address === r.address;

export async function areaPlan(db: Db, orgId: number, userId: number): Promise<AreaPlan> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const [drivers, rows] = await Promise.all([
    listDrivers(db, orgId, userId),
    peopleAtHome(db, orgId),
  ]);
  const { orsKey } = await import('./ors');
  return {
    drivers: drivers
      .filter((d) => d.active)
      .map((d) => ({ id: d.id, name: d.name, weekdays: d.weekdays })),
    people: rows.map((r) => ({
      id: num(r.id),
      name: `${r.last_name} ${r.first_name}`,
      address: r.address,
      areaDriverId: r.area_driver_id === null ? null : num(r.area_driver_id),
      located: located(r),
    })),
    mapReady: Boolean(orsKey()),
  };
}

async function kitchenOf(db: Db, orgId: number): Promise<{ lat: number; lng: number } | null> {
  const [org] = await db.query<{
    kitchen_address: string | null;
    kitchen_lat: number | null;
    kitchen_lng: number | null;
    kitchen_geo_address: string | null;
  }>(
    'SELECT kitchen_address, kitchen_lat, kitchen_lng, kitchen_geo_address FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  if (org?.kitchen_lat === null || org?.kitchen_lat === undefined) return null;
  if (org.kitchen_geo_address !== org.kitchen_address) return null;
  return { lat: num(org.kitchen_lat), lng: num(org.kitchen_lng) };
}

/**
 * Finds the map positions of addresses not looked up yet (addresses only, never names), a few
 * dozen per press. Returns how many were found and how many are still missing.
 */
export async function locateAddresses(
  db: Db,
  orgId: number,
  userId: number,
): Promise<{ found: number; missing: number }> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const { geocode, orsKey } = await import('./ors');
  if (!orsKey()) throw new HttpError(503, 'noMapKey');
  const kitchen = await kitchenOf(db, orgId);
  const rows = (await peopleAtHome(db, orgId)).filter((r) => r.address && !located(r));
  let found = 0;
  for (const r of rows.slice(0, LOOKUPS_PER_PRESS)) {
    const at = await geocode(r.address!, kitchen ? [kitchen.lng, kitchen.lat] : null).catch(
      () => null,
    );
    if (!at) continue;
    await db.execute(
      'UPDATE canteen_people SET geo_lat = ?, geo_lng = ?, geo_address = ? WHERE id = ? AND org_id = ?',
      [at[1], at[0], r.address, num(r.id), orgId],
    );
    found++;
  }
  return { found, missing: rows.length - found };
}

/**
 * A proposal of areas from the addresses (person id → driver id), not saved: the organisers
 * look at it, change what they want and save. People without a map position are left out.
 */
export async function proposeAreas(
  db: Db,
  orgId: number,
  userId: number,
): Promise<Record<number, number>> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const [drivers, rows, kitchen] = await Promise.all([
    listDrivers(db, orgId, userId),
    peopleAtHome(db, orgId),
    kitchenOf(db, orgId),
  ]);
  const points: Point[] = rows
    .filter(located)
    .map((r) => ({ id: num(r.id), lat: num(r.geo_lat), lng: num(r.geo_lng) }));
  const working = drivers
    .filter((d) => d.active)
    .map((d) => ({
      id: d.id,
      weight: d.weekdays.length * Math.max(1, d.shiftToMin - d.shiftFromMin),
    }));
  if (working.length === 0) throw new HttpError(400, 'noDrivers');
  return Object.fromEntries(sweepAreas(points, kitchen ?? centreOf(points), working));
}

/** Saves the areas: person id → driver id (null: no area). Only this organisation's people. */
export async function saveAreas(
  db: Db,
  orgId: number,
  userId: number,
  areas: Record<string, unknown>,
): Promise<number> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const drivers = new Set((await listDrivers(db, orgId, userId)).map((d) => d.id));
  let saved = 0;
  for (const [key, value] of Object.entries(areas).slice(0, 2000)) {
    const personId = Number(key);
    const driverId = value === null ? null : Number(value);
    if (!Number.isSafeInteger(personId) || (driverId !== null && !drivers.has(driverId))) {
      throw new HttpError(400, 'invalidRequest');
    }
    const res = await db.execute(
      `UPDATE canteen_people SET area_driver_id = ? WHERE id = ? AND org_id = ? AND kind = 'delivery'`,
      [driverId, personId, orgId],
    );
    saved += res.affectedRows;
  }
  return saved;
}

function span(from: unknown, to: unknown): { from: IsoDate; days: number } {
  if (!isIsoDate(from) || !isIsoDate(to)) throw new HttpError(400, 'date', { field: 'day' });
  const days = daysBetween(from, to) + 1;
  if (days < 1 || days > MAX_SPAN_DAYS)
    throw new HttpError(400, 'spanTooLong', { max: MAX_SPAN_DAYS });
  return { from, days };
}

/**
 * Builds the routes of each day from `from` to `to` from the areas: every driver who works
 * that day gets the people of their area who get a delivery, nearest first from the kitchen.
 * Ticks already given stay. People whose area driver does not work that day, or who have no
 * area, are left for the organisers (counted in `toPlace`).
 */
export async function buildRoutes(
  db: Db,
  orgId: number,
  userId: number,
  fromValue: unknown,
  toValue: unknown,
): Promise<{ days: number; routes: number; toPlace: number }> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const { from, days } = span(fromValue, toValue);
  const [rows, kitchen] = await Promise.all([peopleAtHome(db, orgId), kitchenOf(db, orgId)]);
  const areaOf = new Map(
    rows.filter((r) => r.area_driver_id !== null).map((r) => [num(r.id), num(r.area_driver_id)]),
  );
  const positions = new Map(
    rows.filter(located).map((r) => [num(r.id), { lat: num(r.geo_lat), lng: num(r.geo_lng) }]),
  );
  let routes = 0;
  let toPlace = 0;
  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    const plan = await dayPlan(db, orgId, userId, day);
    const due = [
      ...plan.unassigned.map((p) => p.id),
      ...plan.routes.flatMap((r) => r.stops.map((s) => s.id)),
    ];
    const working = new Set(plan.routes.map((r) => r.driver.id));
    for (const route of plan.routes) {
      const mine = due.filter((id) => areaOf.get(id) === route.driver.id);
      await setRoute(
        db,
        orgId,
        userId,
        day,
        route.driver.id,
        nearestOrder(mine, positions, kitchen),
      );
      routes++;
    }
    toPlace += due.filter((id) => !working.has(areaOf.get(id) ?? -1)).length;
  }
  return { days, routes, toPlace };
}

/** The day plans of a span, for printing one driver's (or every driver's) route sheets. */
export async function plansBetween(
  db: Db,
  orgId: number,
  userId: number,
  fromValue: unknown,
  toValue: unknown,
): Promise<DayPlan[]> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const { from, days } = span(fromValue, toValue);
  const out: DayPlan[] = [];
  for (let i = 0; i < days; i++) out.push(await dayPlan(db, orgId, userId, addDays(from, i)));
  return out;
}
