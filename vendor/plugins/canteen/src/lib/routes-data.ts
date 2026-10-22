import type { PluginDatabase } from '@devquake/plugin-sdk';
import { requireCan } from './data';
import { addDays, type IsoDate } from './dates';
import { HttpError } from './http';
import { weekdayOfDay } from './meals';
import type { Diet } from './model';
import { can as roleCan, type Role } from './roles';
import { estimate, routeOk, type TimedStop, type Window } from './routes';

/**
 * Drivers and delivery routes on the app's own database (docs/plugins/ideas/canteen.md, step 3).
 * Everything here needs `routes.edit`: the route sheets carry names, addresses and phones.
 */

type Db = Omit<PluginDatabase, 'transaction'>;

const num = (v: unknown) => Number(v);
const minutes = (v: unknown) => (v === null || v === undefined ? null : num(v));

// ---------------------------------------------------------------------------------------------
// Drivers

export interface Driver {
  id: number;
  name: string;
  phone: string | null;
  /** Their DevQuake account (staff with the driver role), for their phone; null: sheet only. */
  userId: number | null;
  weekdays: number[];
  shiftFromMin: number;
  shiftToMin: number;
  active: boolean;
}

export interface DriverInput {
  name: string;
  phone: string | null;
  userId: number | null;
  weekdays: number[];
  shiftFromMin: number;
  shiftToMin: number;
  active: boolean;
}

async function driversOf(db: Db, orgId: number): Promise<Driver[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    phone: string | null;
    user_id: number | null;
    weekdays: string;
    shift_from_min: number;
    shift_to_min: number;
    active: number;
  }>(
    `SELECT id, name, phone, user_id, weekdays, shift_from_min, shift_to_min, active FROM canteen_drivers
      WHERE org_id = ? ORDER BY active DESC, name`,
    [orgId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    name: r.name,
    phone: r.phone,
    userId: r.user_id === null ? null : num(r.user_id),
    weekdays: r.weekdays.split(',').filter(Boolean).map(Number),
    shiftFromMin: num(r.shift_from_min),
    shiftToMin: num(r.shift_to_min),
    active: num(r.active) === 1,
  }));
}

export async function listDrivers(db: Db, orgId: number, userId: number): Promise<Driver[]> {
  await requireCan(db, orgId, userId, 'routes.edit');
  return driversOf(db, orgId);
}

export async function saveDriver(
  db: Db,
  orgId: number,
  userId: number,
  input: DriverInput,
  id?: number,
): Promise<number> {
  await requireCan(db, orgId, userId, 'routes.edit');
  if (input.userId !== null) {
    const accounts = await driverAccountsOf(db, orgId);
    if (!accounts.some((a) => a.userId === input.userId))
      throw new HttpError(400, 'invalidRequest');
  }
  const values = [
    input.name,
    input.phone,
    input.userId,
    input.weekdays.join(','),
    input.shiftFromMin,
    input.shiftToMin,
    input.active ? 1 : 0,
  ];
  if (id !== undefined) {
    const res = await db.execute(
      `UPDATE canteen_drivers SET name = ?, phone = ?, user_id = ?, weekdays = ?, shift_from_min = ?,
         shift_to_min = ?, active = ? WHERE id = ? AND org_id = ?`,
      [...values, id, orgId],
    );
    if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
    return id;
  }
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM canteen_drivers WHERE org_id = ?',
    [orgId],
  );
  if (num(count?.n ?? 0) >= 50) throw new HttpError(400, 'tooManyDrivers', { max: 50 });
  const res = await db.execute(
    `INSERT INTO canteen_drivers (name, phone, user_id, weekdays, shift_from_min, shift_to_min,
       active, org_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [...values, orgId],
  );
  return res.insertId;
}

/** Removes a driver with their routes (the people on them become unassigned). */
export async function deleteDriver(db: Db, orgId: number, id: number, userId: number) {
  await requireCan(db, orgId, userId, 'routes.edit');
  await db.execute('DELETE FROM canteen_drivers WHERE id = ? AND org_id = ?', [id, orgId]);
}

export async function setMinutesPerStop(db: Db, orgId: number, userId: number, value: number) {
  await requireCan(db, orgId, userId, 'routes.edit');
  await db.execute('UPDATE canteen_orgs SET minutes_per_stop = ? WHERE id = ?', [value, orgId]);
}

async function minutesPerStopOf(db: Db, orgId: number): Promise<number> {
  const [row] = await db.query<{ m: number }>(
    'SELECT minutes_per_stop AS m FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  return num(row?.m ?? 12);
}

// ---------------------------------------------------------------------------------------------
// A day's routes

/** What a route sheet shows of a person: never their personal numbers or medical data. */
export interface StopPerson {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  observation: string | null;
  diet: Diet;
  allergies: string | null;
  window: Window;
  /** When the driver ticked it as handed over (UTC), on a route only. */
  deliveredAt: string | null;
  /** The driver's comment on the stop, e.g. "left with the neighbour". */
  deliveryNote: string | null;
}

export interface DayRoute {
  driver: Driver;
  stops: (StopPerson & TimedStop)[];
  ok: boolean;
}

export interface DayPlan {
  day: IsoDate;
  minutesPerStop: number;
  routes: DayRoute[];
  /** People who get a delivery this day but are on no route yet. */
  unassigned: StopPerson[];
}

interface StopRow {
  id: number;
  first_name: string;
  last_name: string;
  address: string | null;
  phone: string | null;
  observation: string | null;
  diet: Diet;
  allergies: string | null;
  window_from_min: number | null;
  window_to_min: number | null;
  driver_id: number | null;
  position: number | null;
  delivered_at: Date | string | null;
  delivery_note: string | null;
}

function stopPerson(r: StopRow): StopPerson {
  return {
    id: num(r.id),
    name: `${r.last_name} ${r.first_name}`,
    address: r.address,
    phone: r.phone,
    observation: r.observation,
    diet: r.diet,
    allergies: r.allergies,
    window: { fromMin: minutes(r.window_from_min), toMin: minutes(r.window_to_min) },
    deliveredAt: r.delivered_at ? new Date(r.delivered_at).toISOString() : null,
    deliveryNote: r.delivery_note,
  };
}

async function planOf(db: Db, orgId: number, day: IsoDate): Promise<DayPlan> {
  const weekday = weekdayOfDay(day);
  const [drivers, minutesPerStop] = await Promise.all([
    driversOf(db, orgId),
    minutesPerStopOf(db, orgId),
  ]);
  // Everyone who gets a delivery that day, with their stop when they are on a route.
  const rows = await db.query<StopRow>(
    `SELECT p.id, p.first_name, p.last_name, p.address, p.phone, p.observation, p.diet,
            p.allergies, p.window_from_min, p.window_to_min, s.driver_id, s.position,
            s.delivered_at, s.delivery_note
       FROM canteen_people p
       JOIN canteen_delivery_days dd ON dd.person_id = p.id AND dd.weekday = ?
       LEFT JOIN canteen_route_stops s ON s.person_id = p.id AND s.day = ? AND s.org_id = p.org_id
      WHERE p.org_id = ? AND p.kind = 'delivery' AND p.status = 'active'
        AND NOT EXISTS (SELECT 1 FROM canteen_hospital_stays h WHERE h.person_id = p.id AND h.returned_on IS NULL)
      ORDER BY s.position, p.last_name, p.first_name`,
    [weekday, day, orgId],
  );
  const working = drivers.filter(
    (d) =>
      d.active && (d.weekdays.includes(weekday) || rows.some((r) => num(r.driver_id) === d.id)),
  );
  const routes = working.map((driver) => {
    const people = rows.filter((r) => r.driver_id !== null && num(r.driver_id) === driver.id);
    const persons = people.map(stopPerson);
    const timed = estimate(
      persons.map((p) => ({ personId: p.id, window: p.window })),
      { fromMin: driver.shiftFromMin, toMin: driver.shiftToMin },
      minutesPerStop,
    );
    return {
      driver,
      stops: persons.map((p, i) => ({ ...p, ...timed[i]! })),
      ok: routeOk(timed),
    };
  });
  const onRoute = new Set(routes.flatMap((r) => r.stops.map((s) => s.id)));
  const unassigned = rows.filter((r) => !onRoute.has(num(r.id))).map(stopPerson);
  return { day, minutesPerStop, routes, unassigned };
}

export async function dayPlan(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
): Promise<DayPlan> {
  await requireCan(db, orgId, userId, 'routes.edit');
  return planOf(db, orgId, day);
}

/**
 * Sets a driver's whole route for a day, in order. People on it leave any other route of that
 * day; only people who get a delivery that day can be on it.
 */
export async function setRoute(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
  driverId: number,
  personIds: number[],
) {
  await requireCan(db, orgId, userId, 'routes.edit');
  const drivers = await driversOf(db, orgId);
  if (!drivers.some((d) => d.id === driverId)) throw new HttpError(404, 'notFound');
  const plan = await planOf(db, orgId, day);
  const allowed = new Set([
    ...plan.unassigned.map((p) => p.id),
    ...plan.routes.flatMap((r) => r.stops.map((s) => s.id)),
  ]);
  if (personIds.some((id) => !allowed.has(id)) || new Set(personIds).size !== personIds.length) {
    throw new HttpError(400, 'invalidRequest');
  }
  // Stops that leave this route go; the others keep their "delivered" tick when reordered.
  await db.execute(
    `DELETE FROM canteen_route_stops WHERE org_id = ? AND day = ? AND driver_id = ?
       ${personIds.length ? `AND person_id NOT IN (${personIds.map(() => '?').join(', ')})` : ''}`,
    [orgId, day, driverId, ...personIds],
  );
  for (const [position, personId] of personIds.entries()) {
    await db.execute(
      `INSERT INTO canteen_route_stops (org_id, day, person_id, driver_id, position) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id), position = VALUES(position)`,
      [orgId, day, personId, driverId, position],
    );
  }
}

/** Takes a person off the day's routes. */
export async function unassign(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
  personId: number,
) {
  await requireCan(db, orgId, userId, 'routes.edit');
  await db.execute(
    'DELETE FROM canteen_route_stops WHERE org_id = ? AND day = ? AND person_id = ?',
    [orgId, day, personId],
  );
}

/**
 * Copies the routes of the same weekday one week earlier onto `day`, for the people who still
 * get a delivery that day; the day's routes are replaced.
 */
export async function copyFromLastWeek(db: Db, orgId: number, userId: number, day: IsoDate) {
  await requireCan(db, orgId, userId, 'routes.edit');
  const plan = await planOf(db, orgId, day);
  const allowed = new Set([
    ...plan.unassigned.map((p) => p.id),
    ...plan.routes.flatMap((r) => r.stops.map((s) => s.id)),
  ]);
  const before = await db.query<{ person_id: number; driver_id: number; position: number }>(
    `SELECT person_id, driver_id, position FROM canteen_route_stops
      WHERE org_id = ? AND day = ? ORDER BY driver_id, position`,
    [orgId, addDays(day, -7)],
  );
  await db.execute('DELETE FROM canteen_route_stops WHERE org_id = ? AND day = ?', [orgId, day]);
  let copied = 0;
  for (const s of before) {
    if (!allowed.has(num(s.person_id))) continue;
    await db.execute(
      'INSERT INTO canteen_route_stops (org_id, day, person_id, driver_id, position) VALUES (?, ?, ?, ?, ?)',
      [orgId, day, s.person_id, s.driver_id, s.position],
    );
    copied++;
  }
  return copied;
}

// ---------------------------------------------------------------------------------------------
// The week

export interface WeekDay {
  day: IsoDate;
  routes: { driverId: number; name: string; stops: number; ok: boolean }[];
  unassigned: number;
}

export async function weekRoutes(
  db: Db,
  orgId: number,
  userId: number,
  monday: IsoDate,
): Promise<WeekDay[]> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const plan = await planOf(db, orgId, addDays(monday, i));
    days.push({
      day: plan.day,
      routes: plan.routes.map((r) => ({
        driverId: r.driver.id,
        name: r.driver.name,
        stops: r.stops.length,
        ok: r.ok,
      })),
      unassigned: plan.unassigned.length,
    });
  }
  return days;
}

// ---------------------------------------------------------------------------------------------
// The driver's own view

/** Staff with the driver role, who can be linked to a driver for their phone. */
async function driverAccountsOf(
  db: Db,
  orgId: number,
): Promise<{ userId: number; name: string }[]> {
  const rows = await db.query<{ user_id: number; display_name: string }>(
    "SELECT user_id, display_name FROM canteen_staff WHERE org_id = ? AND role = 'driver' ORDER BY display_name",
    [orgId],
  );
  return rows.map((r) => ({ userId: num(r.user_id), name: r.display_name }));
}

export async function driverAccounts(db: Db, orgId: number, userId: number) {
  await requireCan(db, orgId, userId, 'routes.edit');
  return driverAccountsOf(db, orgId);
}

/** The signed-in driver's route on `day` (their stops only), or null when they have none. */
export async function myRoute(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
): Promise<DayRoute | null> {
  await requireCan(db, orgId, userId, 'route.own');
  const plan = await planOf(db, orgId, day);
  return plan.routes.find((r) => r.driver.userId === userId) ?? null;
}

/**
 * Ticks a stop as delivered (or not). The driver of that route on their phone, or the people
 * who plan routes.
 */
export async function markDelivered(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
  personId: number,
  change: { delivered?: boolean; note?: string | null },
) {
  const staff = await requireCan(db, orgId, userId, 'org.view');
  const [stop] = await db.query<{ user_id: number | null }>(
    `SELECT d.user_id FROM canteen_route_stops s JOIN canteen_drivers d ON d.id = s.driver_id
      WHERE s.org_id = ? AND s.day = ? AND s.person_id = ?`,
    [orgId, day, personId],
  );
  if (!stop) throw new HttpError(404, 'notFound');
  const ownStop = stop.user_id !== null && num(stop.user_id) === userId;
  if (!ownStop && !(await canPlan(staff.role))) throw new HttpError(403, 'notAllowed');
  if (change.delivered !== undefined) {
    await db.execute(
      // sql-safe: delivered — one of two fixed fragments; the values are ? params.
      `UPDATE canteen_route_stops SET delivered_at = ${change.delivered ? 'UTC_TIMESTAMP()' : 'NULL'}
        WHERE org_id = ? AND day = ? AND person_id = ?`,
      [orgId, day, personId],
    );
  }
  if (change.note !== undefined) {
    await db.execute(
      'UPDATE canteen_route_stops SET delivery_note = ? WHERE org_id = ? AND day = ? AND person_id = ?',
      [change.note, orgId, day, personId],
    );
  }
}

/**
 * What each diet gets in the day's delivered meal (the package a driver hands over): the
 * menu, or the diet's own variant. For the driver of a route and for planners.
 */
export async function packagesOf(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
): Promise<{ menu: string | null; variants: Partial<Record<Diet, string>> }> {
  const staff = await requireCan(db, orgId, userId, 'org.view');
  if (!roleCan(staff.role, 'route.own') && !roleCan(staff.role, 'routes.edit')) {
    throw new HttpError(403, 'notAllowed');
  }
  const [menu] = await db.query<{ id: number; dishes: string }>(
    'SELECT id, dishes FROM canteen_menus WHERE org_id = ? AND day = ? AND meal_time_id = 0',
    [orgId, day],
  );
  if (!menu) return { menu: null, variants: {} };
  const rows = await db.query<{ diet: Diet; dishes: string }>(
    'SELECT diet, dishes FROM canteen_menu_variants WHERE menu_id = ?',
    [menu.id],
  );
  return {
    menu: menu.dishes,
    variants: Object.fromEntries(rows.map((r) => [r.diet, r.dishes])),
  };
}

const canPlan = async (role: Role) => roleCan(role, 'routes.edit');

// ---------------------------------------------------------------------------------------------
// The order of stops from the map (OpenRouteService)

/** At most this many stops are sent for one route (the service's free plan limits jobs). */
export const MAX_OPTIMISED_STOPS = 50;

export async function kitchenAddress(
  db: Db,
  orgId: number,
  userId: number,
): Promise<string | null> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const [row] = await db.query<{ a: string | null }>(
    'SELECT kitchen_address AS a FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  return row?.a ?? null;
}

export async function setKitchenAddress(
  db: Db,
  orgId: number,
  userId: number,
  address: string | null,
) {
  await requireCan(db, orgId, userId, 'routes.edit');
  await db.execute('UPDATE canteen_orgs SET kitchen_address = ? WHERE id = ?', [address, orgId]);
}

/**
 * Computes the order of a driver's stops on `day` with the map: looks up the kitchen and every
 * address not looked up yet (or changed since), then sets the route in the computed order.
 * Returns how many people could not be fitted in their window or the shift (they come last).
 */
export async function computeOrder(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
  driverId: number,
): Promise<{ unassigned: number }> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const { geocode, optimise, optimisationRequest, orderFrom, orsKey } = await import('./ors');
  if (!orsKey()) throw new HttpError(503, 'noMapKey');
  const plan = await planOf(db, orgId, day);
  const route = plan.routes.find((r) => r.driver.id === driverId);
  if (!route) throw new HttpError(404, 'notFound');
  if (route.stops.length < 2) return { unassigned: 0 };
  if (route.stops.length > MAX_OPTIMISED_STOPS) {
    throw new HttpError(400, 'tooManyStops', { max: MAX_OPTIMISED_STOPS });
  }

  const lookup = async (address: string, near: [number, number] | null) => {
    try {
      return await geocode(address, near);
    } catch {
      throw new HttpError(502, 'mapUnavailable');
    }
  };

  const [org] = await db.query<{
    kitchen_address: string | null;
    kitchen_lat: number | null;
    kitchen_lng: number | null;
    kitchen_geo_address: string | null;
  }>(
    'SELECT kitchen_address, kitchen_lat, kitchen_lng, kitchen_geo_address FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  if (!org?.kitchen_address) throw new HttpError(400, 'noKitchen');
  let kitchen: [number, number] | null =
    org.kitchen_lat !== null && org.kitchen_geo_address === org.kitchen_address
      ? [num(org.kitchen_lng), num(org.kitchen_lat)]
      : null;
  if (!kitchen) {
    kitchen = await lookup(org.kitchen_address, null);
    if (!kitchen) throw new HttpError(400, 'kitchenNotFound');
    await db.execute(
      'UPDATE canteen_orgs SET kitchen_lat = ?, kitchen_lng = ?, kitchen_geo_address = ? WHERE id = ?',
      [kitchen[1], kitchen[0], org.kitchen_address, orgId],
    );
  }

  const ids = route.stops.map((s) => s.id);
  const rows = await db.query<{
    id: number;
    first_name: string;
    last_name: string;
    address: string | null;
    geo_lat: number | null;
    geo_lng: number | null;
    geo_address: string | null;
  }>(
    `SELECT id, first_name, last_name, address, geo_lat, geo_lng, geo_address FROM canteen_people
      WHERE org_id = ? AND id IN (${ids.map(() => '?').join(', ')})`,
    [orgId, ...ids],
  );
  const stops = [];
  for (const s of route.stops) {
    const r = rows.find((x) => num(x.id) === s.id)!;
    const name = `${r.last_name} ${r.first_name}`;
    if (!r.address) throw new HttpError(400, 'addressNotFound', { name });
    let at: [number, number] | null =
      r.geo_lat !== null && r.geo_address === r.address ? [num(r.geo_lng), num(r.geo_lat)] : null;
    if (!at) {
      at = await lookup(r.address, kitchen);
      if (!at) throw new HttpError(400, 'addressNotFound', { name });
      await db.execute(
        'UPDATE canteen_people SET geo_lat = ?, geo_lng = ?, geo_address = ? WHERE id = ? AND org_id = ?',
        [at[1], at[0], r.address, s.id, orgId],
      );
    }
    stops.push({ personId: s.id, at, fromMin: s.window.fromMin, toMin: s.window.toMin });
  }

  let answer: unknown;
  try {
    answer = await optimise(
      optimisationRequest(stops, kitchen, {
        fromMin: route.driver.shiftFromMin,
        toMin: route.driver.shiftToMin,
      }),
    );
  } catch {
    throw new HttpError(502, 'mapUnavailable');
  }
  const { order, unassigned } = orderFrom(answer, ids);
  await setRoute(db, orgId, userId, day, driverId, order);
  return { unassigned: unassigned.length };
}

/** A stop's position on the map, in route order. */
export interface StopPosition {
  personId: number;
  lat: number;
  lng: number;
}

/**
 * The positions of the signed-in driver's stops on `day`, for their map. Addresses not looked
 * up yet are looked up now with OpenRouteService when it is set up (addresses only, once);
 * without it, only positions found earlier are shown and the rest are counted as missing.
 */
export async function myRoutePositions(
  db: Db,
  orgId: number,
  userId: number,
  day: IsoDate,
): Promise<{ stops: StopPosition[]; kitchen: StopPosition | null; missing: number }> {
  const route = await myRoute(db, orgId, userId, day);
  if (!route || route.stops.length === 0) return { stops: [], kitchen: null, missing: 0 };
  const { geocode, orsKey } = await import('./ors');
  const [org] = await db.query<{ lat: number | null; lng: number | null }>(
    'SELECT kitchen_lat AS lat, kitchen_lng AS lng FROM canteen_orgs WHERE id = ?',
    [orgId],
  );
  const kitchen =
    org?.lat !== null && org?.lat !== undefined
      ? { personId: 0, lat: num(org.lat), lng: num(org.lng) }
      : null;
  const ids = route.stops.map((s) => s.id).slice(0, MAX_OPTIMISED_STOPS);
  const rows = await db.query<{
    id: number;
    address: string | null;
    geo_lat: number | null;
    geo_lng: number | null;
    geo_address: string | null;
  }>(
    `SELECT id, address, geo_lat, geo_lng, geo_address FROM canteen_people
      WHERE org_id = ? AND id IN (${ids.map(() => '?').join(', ')})`,
    [orgId, ...ids],
  );
  const stops: StopPosition[] = [];
  let missing = 0;
  for (const id of ids) {
    const r = rows.find((x) => num(x.id) === id);
    if (!r?.address) {
      missing++;
      continue;
    }
    if (r.geo_lat !== null && r.geo_address === r.address) {
      stops.push({ personId: id, lat: num(r.geo_lat), lng: num(r.geo_lng) });
      continue;
    }
    const at = orsKey()
      ? await geocode(r.address, kitchen ? [kitchen.lng, kitchen.lat] : null).catch(() => null)
      : null;
    if (!at) {
      missing++;
      continue;
    }
    await db.execute(
      'UPDATE canteen_people SET geo_lat = ?, geo_lng = ?, geo_address = ? WHERE id = ? AND org_id = ?',
      [at[1], at[0], r.address, id, orgId],
    );
    stops.push({ personId: id, lat: at[1], lng: at[0] });
  }
  return { stops, kitchen, missing };
}

/** The routes of a span of days for the calendar's day-by-day grid: stops in order per driver. */
export async function routesBetween(
  db: Db,
  orgId: number,
  userId: number,
  from: IsoDate,
  to: IsoDate,
): Promise<
  {
    day: IsoDate;
    driver: string;
    stops: { name: string; delivered: boolean; note: string | null }[];
  }[]
> {
  await requireCan(db, orgId, userId, 'routes.edit');
  const rows = await db.query<{
    day: string;
    driver: string;
    first_name: string;
    last_name: string;
    delivered: number;
    note: string | null;
  }>(
    `SELECT DATE_FORMAT(s.day, '%Y-%m-%d') AS day, d.name AS driver, p.first_name, p.last_name,
            s.delivered_at IS NOT NULL AS delivered, s.delivery_note AS note
       FROM canteen_route_stops s
       JOIN canteen_drivers d ON d.id = s.driver_id
       JOIN canteen_people p ON p.id = s.person_id
      WHERE s.org_id = ? AND s.day >= ? AND s.day <= ?
      ORDER BY s.day, d.name, s.position`,
    [orgId, from, to],
  );
  const routes: Awaited<ReturnType<typeof routesBetween>> = [];
  for (const r of rows) {
    let route = routes.find((x) => x.day === r.day && x.driver === r.driver);
    if (!route) {
      route = { day: r.day, driver: r.driver, stops: [] };
      routes.push(route);
    }
    route.stops.push({
      name: `${r.last_name} ${r.first_name}`,
      delivered: num(r.delivered) === 1,
      note: r.note,
    });
  }
  return routes;
}
