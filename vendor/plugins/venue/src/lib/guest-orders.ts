// Guests order from the table's sticker page; the table's waiter confirms each order (owner's
// decision, 2026-10-31). Until then nothing reaches the bill, the stations or the stock; on
// confirmation the lines go onto the bill through the normal order (addLine), so stock checks,
// recipes and stations apply as for staff.

import type { PluginDatabase as Db } from '@devquake/plugin-sdk';
import { waiterFor } from './calls';
import type { Item } from './data';
import { addLine, openBill } from './floor';
import { shortNow } from './stock';

/** At most this many different items, and of each, in one order. */
export const ORDER_LINES_MAX = 15;
export const ORDER_QTY_MAX = 10;
const NOTE_MAX = 120;
/** At most this many orders waiting per table, and this long between a table's orders. */
const WAITING_MAX = 3;
const ORDER_COOLDOWN_SECONDS = 20;
/** Orders are kept this long (the guest's status, then gone). */
export const ORDERS_KEEP_DAYS = 30;

export interface OrderLine {
  itemId: number;
  qty: number;
  note: string | null;
}

export interface GuestOrder {
  id: number;
  tableId: number;
  tableName: string;
  /** The lines with the items' names and prices as they were when ordered. */
  lines: (OrderLine & { name: string; priceMinor: number })[];
  status: 'waiting' | 'confirmed' | 'refused';
  waiterStaffId: number | null;
  createdAt: string;
  answeredBy: string | null;
}

/**
 * A guest's order checked against the menu: known items that can be ordered now (on the menu,
 * nothing short), whole quantities 1–10, at most 15 items, a short note each; the same item twice
 * is added up. Null when nothing is left.
 */
export function checkOrder(
  raw: unknown,
  menu: Pick<Item, 'id' | 'available' | 'short'>[],
): OrderLine[] | null {
  if (!Array.isArray(raw)) return null;
  const orderable = new Set(
    menu.filter((i) => i.available && i.short.length === 0).map((i) => i.id),
  );
  const out = new Map<number, OrderLine>();
  for (const r of raw.slice(0, ORDER_LINES_MAX * 2) as Record<string, unknown>[]) {
    const itemId = Number(r?.itemId);
    const qty = Math.round(Number(r?.qty));
    if (!orderable.has(itemId) || !Number.isFinite(qty) || qty < 1) continue;
    const note =
      typeof r.note === 'string'
        ? r.note.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX) || null
        : null;
    const prev = out.get(itemId);
    out.set(itemId, {
      itemId,
      qty: Math.min(ORDER_QTY_MAX, (prev?.qty ?? 0) + qty),
      note: prev?.note ?? note,
    });
  }
  const lines = [...out.values()].slice(0, ORDER_LINES_MAX);
  return lines.length ? lines : null;
}

interface Row {
  id: number;
  table_id: number;
  table_name: string;
  items: string;
  status: GuestOrder['status'];
  waiter_staff_id: number | null;
  created_at: Date | string;
  answered_by: string | null;
}

const COLS = 'id, table_id, table_name, items, status, waiter_staff_id, created_at, answered_by';

const toOrder = (r: Row): GuestOrder => ({
  id: Number(r.id),
  tableId: Number(r.table_id),
  tableName: r.table_name,
  lines: (() => {
    try {
      return JSON.parse(r.items) as GuestOrder['lines'];
    } catch {
      return [];
    }
  })(),
  status: r.status,
  waiterStaffId: r.waiter_staff_id === null ? null : Number(r.waiter_staff_id),
  createdAt: new Date(r.created_at).toISOString(),
  answeredBy: r.answered_by,
});

/**
 * A guest's order for the table's waiter (the section's waiter on shift, else the least busy).
 * 'busy' when the table has 3 orders waiting or ordered seconds ago.
 */
export async function placeOrder(
  db: Db,
  venueId: number,
  table: { id: number; name: string },
  lines: OrderLine[],
  menu: Pick<Item, 'id' | 'name' | 'priceMinor'>[],
): Promise<GuestOrder | 'busy'> {
  const [state] = await db.query<{ waiting: number; recent: number }>(
    `SELECT SUM(status = 'waiting') AS waiting,
            SUM(created_at > UTC_TIMESTAMP() - INTERVAL ? SECOND) AS recent
       FROM guest_orders WHERE venue_id = ? AND table_id = ?`,
    [ORDER_COOLDOWN_SECONDS, venueId, table.id],
  );
  if (Number(state?.waiting ?? 0) >= WAITING_MAX || Number(state?.recent ?? 0) > 0) return 'busy';
  const byId = new Map(menu.map((i) => [i.id, i]));
  const items = lines.map((l) => ({
    ...l,
    name: byId.get(l.itemId)?.name ?? '?',
    priceMinor: byId.get(l.itemId)?.priceMinor ?? 0,
  }));
  // The waiter who already looks after the table's open bill, else its section's (or the least
  // busy one on shift); null when nobody is on shift (then every waiter is told).
  const [bill] = await db.query<{ waiter_staff_id: number | null }>(
    "SELECT waiter_staff_id FROM bills WHERE venue_id = ? AND table_id = ? AND status = 'open' LIMIT 1",
    [venueId, table.id],
  );
  const waiter = bill?.waiter_staff_id
    ? { id: Number(bill.waiter_staff_id) }
    : await waiterFor(db, venueId, table.id);
  const r = await db.execute(
    `INSERT INTO guest_orders (venue_id, table_id, table_name, items, waiter_staff_id)
     VALUES (?, ?, ?, ?, ?)`,
    [venueId, table.id, table.name, JSON.stringify(items), waiter?.id ?? null],
  );
  const [row] = await db.query<Row>(`SELECT ${COLS} FROM guest_orders WHERE id = ?`, [r.insertId]);
  return toOrder(row!);
}

/** The table's latest order (what the guest sees: waiting, confirmed or refused). */
export async function lastOrderOfTable(db: Db, venueId: number, tableId: number) {
  const [r] = await db.query<Row>(
    `SELECT ${COLS} FROM guest_orders WHERE venue_id = ? AND table_id = ? ORDER BY id DESC LIMIT 1`,
    [venueId, tableId],
  );
  return r ? toOrder(r) : null;
}

/** Orders waiting for a waiter, oldest first (the floor and the waiters' apps). */
export async function waitingOrders(db: Db, venueId: number): Promise<GuestOrder[]> {
  const rows = await db.query<Row>(
    `SELECT ${COLS} FROM guest_orders WHERE venue_id = ? AND status = 'waiting'
      ORDER BY id LIMIT 50`,
    [venueId],
  );
  return rows.map(toOrder);
}

/**
 * The waiter confirms (the lines go onto the table's bill, opened if needed, through the normal
 * order) or refuses an order. Items that ran short meanwhile are left out and named in `skipped`.
 * Null when the order is not waiting any more.
 */
export async function answerOrder(
  db: Db,
  venueId: number,
  orderId: number,
  confirm: boolean,
  by: { name: string; staffId: number | null },
): Promise<{ order: GuestOrder; skipped: string[] } | null> {
  const done = await db.execute(
    `UPDATE guest_orders SET status = ?, answered_at = UTC_TIMESTAMP(), answered_by = ?
      WHERE id = ? AND venue_id = ? AND status = 'waiting'`,
    [confirm ? 'confirmed' : 'refused', by.name, orderId, venueId],
  );
  if (done.affectedRows !== 1) return null;
  const [row] = await db.query<Row>(`SELECT ${COLS} FROM guest_orders WHERE id = ?`, [orderId]);
  const order = toOrder(row!);
  const skipped: string[] = [];
  if (confirm) {
    const waiter = by.staffId ? { id: by.staffId, name: by.name } : null;
    const bill = await openBill(db, venueId, order.tableId, by.name, waiter);
    if (bill) {
      const short = await shortNow(db, venueId);
      for (const line of order.lines) {
        if (short.get(line.itemId)?.length) {
          skipped.push(line.name);
          continue;
        }
        const ok = await addLine(db, venueId, bill.id, line.itemId, line.qty, line.note, by.name);
        if (!ok) skipped.push(line.name);
      }
    }
  }
  return { order, skipped };
}

/** The scheduled run: orders older than ORDERS_KEEP_DAYS go. */
export async function deleteOldOrders(db: Db) {
  await db.execute('DELETE FROM guest_orders WHERE created_at < UTC_TIMESTAMP() - INTERVAL ? DAY', [
    ORDERS_KEEP_DAYS,
  ]);
}
