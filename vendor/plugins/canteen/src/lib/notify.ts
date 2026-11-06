// Phone notifications (ADR 0084), only to the people concerned (owner's rule): every driver whose
// route an organiser changed for today or tomorrow (stops added, removed or reordered, a package
// ticked, a comment), never the person who made the change.

import type { PluginDatabase as Db, PluginPush } from '@devquake/plugin-sdk';
import { addDays, type IsoDate } from './dates';

/** Each driver's route of the day as one comparable text: the stops in order, ticks, comments. */
export type RouteSnapshot = Map<number, string>;

export async function routeSnapshot(db: Db, orgId: number, day: IsoDate): Promise<RouteSnapshot> {
  const rows = await db.query<{
    driver_id: number;
    person_id: number;
    delivered: number;
    delivery_note: string | null;
  }>(
    `SELECT driver_id, person_id, delivered_at IS NOT NULL AS delivered, delivery_note
       FROM canteen_route_stops WHERE org_id = ? AND day = ? ORDER BY driver_id, position`,
    [orgId, day],
  );
  const routes: RouteSnapshot = new Map();
  for (const r of rows) {
    const driver = Number(r.driver_id);
    const stop = `${Number(r.person_id)}:${Number(r.delivered) ? 1 : 0}:${r.delivery_note ?? ''}`;
    routes.set(driver, routes.has(driver) ? `${routes.get(driver)}|${stop}` : stop);
  }
  return routes;
}

/** The drivers whose route differs between the two snapshots (gained, lost or changed). */
export function changedDrivers(before: RouteSnapshot, after: RouteSnapshot): number[] {
  const drivers = new Set([...before.keys(), ...after.keys()]);
  return [...drivers].filter((d) => before.get(d) !== after.get(d)).sort((a, b) => a - b);
}

/**
 * Runs a change to the day's routes and tells every driver whose route it changed. Only today's
 * and tomorrow's routes are told (later days are seen when the driver opens them); a failed
 * notification never fails the change.
 */
export async function withRouteNotice<T>(
  scope: { db: Db; push: PluginPush | undefined; user: { id: number }; today: IsoDate },
  orgId: number,
  day: IsoDate,
  change: () => Promise<T>,
): Promise<T> {
  const { db, push, user, today } = scope;
  if (!push || (day !== today && day !== addDays(today, 1))) return change();
  const before = await routeSnapshot(db, orgId, day).catch(() => null);
  const result = await change();
  if (before) {
    await routeSnapshot(db, orgId, day)
      .then((after) =>
        notifyRouteChanged(db, push, orgId, day, changedDrivers(before, after), user.id, today),
      )
      .catch(() => undefined);
  }
  return result;
}

export async function notifyRouteChanged(
  db: Db,
  push: PluginPush,
  orgId: number,
  day: IsoDate,
  driverIds: number[],
  editorUserId: number,
  today: IsoDate,
) {
  if (!driverIds.length) return;
  const rows = await db.query<{ user_id: number | null; org: string }>(
    `SELECT d.user_id, o.name AS org FROM canteen_drivers d JOIN canteen_orgs o ON o.id = d.org_id
      WHERE d.org_id = ? AND d.id IN (${driverIds.map(() => '?').join(', ')})`,
    [orgId, ...driverIds],
  );
  for (const row of rows) {
    const userId = row.user_id ? Number(row.user_id) : null;
    if (!userId || userId === editorUserId) continue;
    await push.send(userId, {
      kind: day === today ? 'route_changed_today' : 'route_changed_tomorrow',
      args: [row.org],
      ref: `route:${orgId}:${day}`,
    });
  }
}
