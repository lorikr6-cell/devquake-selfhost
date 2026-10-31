import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { Station } from './model';

// The kitchen, bar and coffee screens (venue migration 0007): what is still to make at a station,
// oldest first, and marking it made. Every function takes the venue from its caller.

type Db = Omit<PluginDatabase, 'transaction'>;

export const STATION_SCREENS = ['kitchen', 'bar', 'coffee'] as const satisfies readonly Station[];
export type StationScreen = (typeof STATION_SCREENS)[number];
export const isStation = (v: unknown): v is StationScreen =>
  STATION_SCREENS.includes(v as StationScreen);

export interface StationTicket {
  billId: number;
  tableName: string | null;
  lines: {
    id: number;
    name: string;
    qty: number;
    ready: number;
    note: string | null;
    addedBy: string;
    addedAt: string;
  }[];
  /** The oldest line's time (the ticket's age). */
  since: string;
}

/** Open bills' lines for a station that are not all made yet, one ticket per bill, oldest first. */
export async function stationTickets(
  db: Db,
  venueId: number,
  station: StationScreen,
): Promise<StationTicket[]> {
  const rows = await db.query<{
    id: number;
    bill_id: number;
    table_name: string | null;
    name: string;
    qty: number;
    ready: number;
    note: string | null;
    added_by: string;
    added_at: Date;
  }>(
    `SELECT l.id, l.bill_id, b.table_name, l.name, l.qty, l.ready, l.note, l.added_by, l.added_at
       FROM bill_lines l JOIN bills b ON b.id = l.bill_id
      WHERE b.venue_id = ? AND b.status = 'open' AND l.station = ? AND l.ready < l.qty
      ORDER BY l.added_at, l.id LIMIT 300`,
    [venueId, station],
  );
  const tickets = new Map<number, StationTicket>();
  for (const r of rows) {
    const at = new Date(r.added_at).toISOString();
    const t = tickets.get(Number(r.bill_id)) ?? {
      billId: Number(r.bill_id),
      tableName: r.table_name,
      lines: [],
      since: at,
    };
    t.lines.push({
      id: Number(r.id),
      name: r.name,
      qty: Number(r.qty),
      ready: Number(r.ready),
      note: r.note,
      addedBy: r.added_by,
      addedAt: at,
    });
    tickets.set(t.billId, t);
  }
  return [...tickets.values()].sort((a, b) => a.since.localeCompare(b.since));
}

/** Marks a line (all of it) or a whole ticket made at its station, on an open bill. */
export async function markReady(
  db: Db,
  venueId: number,
  target: { lineId: number } | { billId: number; station: StationScreen },
) {
  if ('lineId' in target) {
    await db.execute(
      `UPDATE bill_lines l JOIN bills b ON b.id = l.bill_id
          SET l.ready = l.qty, l.ready_at = UTC_TIMESTAMP()
        WHERE l.id = ? AND b.venue_id = ? AND b.status = 'open'`,
      [target.lineId, venueId],
    );
    return;
  }
  await db.execute(
    `UPDATE bill_lines l JOIN bills b ON b.id = l.bill_id
        SET l.ready = l.qty, l.ready_at = UTC_TIMESTAMP()
      WHERE b.id = ? AND b.venue_id = ? AND b.status = 'open' AND l.station = ? AND l.ready < l.qty`,
    [target.billId, venueId, target.station],
  );
}

/** Minutes since an ISO time (the ticket's age on the screen). */
export const minutesSince = (iso: string, now: number = Date.now()) =>
  Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
