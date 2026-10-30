import { randomInt } from 'node:crypto';
import type { PluginDatabase } from '@devquake/plugin-sdk';
import {
  BILL_KEEP_DAYS,
  NOTE_MAX,
  PIN_TRIES,
  PIN_WAIT_MINUTES,
  QTY_MAX,
  TABLET_SHIFT_HOURS,
  billTotals,
  netOf,
  newCode,
  type Payment,
  type TipChoice,
} from './bill';
import type { Station, StaffRole } from './model';
import type { Venue } from './data';
import { pinMatches } from './secure';

// Tables, bills and the staff on tablets (venue migration 0003). Every function takes the venue
// from its caller (the owner's own venue, or the venue of the tablet in use): nothing reaches
// another venue's rows.

type Db = Omit<PluginDatabase, 'transaction'>;
const code = (n: number) => newCode(n, (max) => randomInt(max));

// --- tables ------------------------------------------------------------------------------------

export interface VenueTable {
  id: number;
  name: string;
  seats: number;
  code: string;
  /** The open bill on it, if any. */
  bill: {
    id: number;
    code: string;
    openedAt: Date;
    openedBy: string;
    pending: number;
    gross: number;
  } | null;
}

export async function listTables(db: Db, venueId: number): Promise<VenueTable[]> {
  const [tables, open] = await Promise.all([
    db.query<{ id: number; name: string; seats: number; code: string }>(
      'SELECT id, name, seats, code FROM venue_tables WHERE venue_id = ? ORDER BY sort_order, id',
      [venueId],
    ),
    db.query<{
      id: number;
      table_id: number | null;
      code: string;
      opened_at: Date;
      opened_by: string;
      pending: number | null;
      gross: number | null;
    }>(
      `SELECT b.id, b.table_id, b.code, b.opened_at, b.opened_by,
              SUM(GREATEST(l.qty - l.delivered, 0)) AS pending, SUM(l.price_minor * l.qty) AS gross
         FROM bills b LEFT JOIN bill_lines l ON l.bill_id = b.id
        WHERE b.venue_id = ? AND b.status = 'open'
        GROUP BY b.id`,
      [venueId],
    ),
  ]);
  const byTable = new Map(open.map((b) => [Number(b.table_id), b]));
  return tables.map((t) => {
    const b = byTable.get(Number(t.id));
    return {
      id: Number(t.id),
      name: t.name,
      seats: Number(t.seats),
      code: t.code,
      bill: b
        ? {
            id: Number(b.id),
            code: b.code,
            openedAt: new Date(b.opened_at),
            openedBy: b.opened_by,
            pending: Number(b.pending ?? 0),
            gross: Number(b.gross ?? 0),
          }
        : null,
    };
  });
}

export async function addTable(db: Db, venueId: number, name: string, seats: number) {
  const [c] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM venue_tables WHERE venue_id = ?',
    [venueId],
  );
  await db.execute(
    'INSERT INTO venue_tables (venue_id, name, seats, code, sort_order) VALUES (?, ?, ?, ?, ?)',
    [venueId, name, seats, code(10), Number(c?.n ?? 0)],
  );
}

export async function updateTable(
  db: Db,
  venueId: number,
  id: number,
  name: string,
  seats: number,
) {
  const r = await db.execute(
    'UPDATE venue_tables SET name = ?, seats = ? WHERE id = ? AND venue_id = ?',
    [name, seats, id, venueId],
  );
  return r.affectedRows === 1;
}

/** A new sticker code (a lost or copied sticker): the old one stops working. */
export async function newTableCode(db: Db, venueId: number, id: number) {
  const r = await db.execute('UPDATE venue_tables SET code = ? WHERE id = ? AND venue_id = ?', [
    code(10),
    id,
    venueId,
  ]);
  return r.affectedRows === 1;
}

export async function removeTable(db: Db, venueId: number, id: number) {
  const r = await db.execute('DELETE FROM venue_tables WHERE id = ? AND venue_id = ?', [
    id,
    venueId,
  ]);
  return r.affectedRows === 1;
}

/** The table behind a sticker code, with its venue. */
export async function tableByCode(db: Db, tableCode: string) {
  const [t] = await db.query<{ id: number; venue_id: number; name: string }>(
    'SELECT id, venue_id, name FROM venue_tables WHERE code = ?',
    [tableCode],
  );
  return t ? { id: Number(t.id), venueId: Number(t.venue_id), name: t.name } : null;
}

// --- bills -------------------------------------------------------------------------------------

export interface Line {
  id: number;
  itemId: number | null;
  name: string;
  priceMinor: number;
  vatRate: number;
  station: Station;
  qty: number;
  delivered: number;
  note: string | null;
  addedBy: string;
}

export interface Bill {
  id: number;
  venueId: number;
  tableId: number | null;
  tableName: string | null;
  code: string;
  status: 'open' | 'final';
  openedBy: string;
  openedAt: Date;
  tip: TipChoice;
  finalizedAt: Date | null;
  finalizedBy: string | null;
  payment: Payment | null;
  lines: Line[];
}

async function billWhere(db: Db, where: string, args: unknown[]): Promise<Bill | null> {
  const [b] = await db.query<{
    id: number;
    venue_id: number;
    table_id: number | null;
    table_name: string | null;
    code: string;
    status: 'open' | 'final';
    opened_by: string;
    opened_at: Date;
    tip_percent: number | null;
    tip_fixed: number;
    finalized_at: Date | null;
    finalized_by: string | null;
    payment: Payment | null;
  }>(
    // sql-safe: where — fixed conditions written in this file (billOfVenue, billByCode, …)
    `SELECT id, venue_id, table_id, table_name, code, status, opened_by, opened_at, tip_percent,
            tip_fixed, finalized_at, finalized_by, payment FROM bills WHERE ${where}`,
    args,
  );
  if (!b) return null;
  const lines = await db.query<{
    id: number;
    item_id: number | null;
    name: string;
    price_minor: number | string;
    vat_rate: number;
    station: Station;
    qty: number;
    delivered: number;
    note: string | null;
    added_by: string;
  }>(
    `SELECT id, item_id, name, price_minor, vat_rate, station, qty, delivered, note, added_by
       FROM bill_lines WHERE bill_id = ? ORDER BY id`,
    [b.id],
  );
  return {
    id: Number(b.id),
    venueId: Number(b.venue_id),
    tableId: b.table_id === null ? null : Number(b.table_id),
    tableName: b.table_name,
    code: b.code,
    status: b.status,
    openedBy: b.opened_by,
    openedAt: new Date(b.opened_at),
    tip: {
      percent: b.tip_percent === null ? null : Number(b.tip_percent),
      fixed: b.tip_fixed === 1,
    },
    finalizedAt: b.finalized_at ? new Date(b.finalized_at) : null,
    finalizedBy: b.finalized_by,
    payment: b.payment,
    lines: lines.map((l) => ({
      id: Number(l.id),
      itemId: l.item_id === null ? null : Number(l.item_id),
      name: l.name,
      priceMinor: Number(l.price_minor),
      vatRate: Number(l.vat_rate),
      station: l.station,
      qty: Number(l.qty),
      delivered: Number(l.delivered),
      note: l.note,
      addedBy: l.added_by,
    })),
  };
}

/** Of a venue (staff and owner): any of its bills by id. */
export const billOfVenue = (db: Db, venueId: number, id: number) =>
  billWhere(db, 'id = ? AND venue_id = ?', [id, venueId]);

/** For the guests: the bill behind its own code. */
export const billByCode = (db: Db, billCode: string) => billWhere(db, 'code = ?', [billCode]);

/** The open bill on a table, if any. */
export const openBillOfTable = (db: Db, venueId: number, tableId: number) =>
  billWhere(db, "venue_id = ? AND table_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1", [
    venueId,
    tableId,
  ]);

/** Opens a bill on a table (or returns the one already open there), with a fresh guest code. */
export async function openBill(db: Db, venueId: number, tableId: number, by: string) {
  const open = await openBillOfTable(db, venueId, tableId);
  if (open) return open;
  const [t] = await db.query<{ name: string }>(
    'SELECT name FROM venue_tables WHERE id = ? AND venue_id = ?',
    [tableId, venueId],
  );
  if (!t) return null;
  const r = await db.execute(
    'INSERT INTO bills (venue_id, table_id, table_name, code, opened_by) VALUES (?, ?, ?, ?, ?)',
    [venueId, tableId, t.name, code(12), by],
  );
  return billOfVenue(db, venueId, r.insertId);
}

/** Adds a menu item to an open bill (a snapshot of its name, price, VAT and station). */
export async function addLine(
  db: Db,
  venueId: number,
  billId: number,
  itemId: number,
  qty: number,
  note: string | null,
  by: string,
): Promise<boolean> {
  const [item] = await db.query<{
    name: string;
    price_minor: number | string;
    vat_rate: number;
    station: Station;
  }>(
    `SELECT i.name, i.price_minor, i.vat_rate, i.station FROM menu_items i
       JOIN bills b ON b.venue_id = i.venue_id
      WHERE i.id = ? AND i.venue_id = ? AND b.id = ? AND b.status = 'open'`,
    [itemId, venueId, billId],
  );
  if (!item) return false;
  await db.execute(
    `INSERT INTO bill_lines (bill_id, item_id, name, price_minor, vat_rate, station, qty, note, added_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      billId,
      itemId,
      item.name,
      Number(item.price_minor),
      item.vat_rate,
      item.station,
      Math.min(QTY_MAX, Math.max(1, qty)),
      note ? note.slice(0, NOTE_MAX) : null,
      by,
    ],
  );
  return true;
}

/** How many of a line were brought to the table (0 to its quantity), on an open bill. */
export async function setDelivered(db: Db, venueId: number, lineId: number, delivered: number) {
  await db.execute(
    `UPDATE bill_lines l JOIN bills b ON b.id = l.bill_id
        SET l.delivered = LEAST(GREATEST(?, 0), l.qty)
      WHERE l.id = ? AND b.venue_id = ? AND b.status = 'open'`,
    [delivered, lineId, venueId],
  );
}

/** Removes a line not yet brought (a mistake), on an open bill. */
export async function removeLine(db: Db, venueId: number, lineId: number) {
  const r = await db.execute(
    `DELETE l FROM bill_lines l JOIN bills b ON b.id = l.bill_id
      WHERE l.id = ? AND b.venue_id = ? AND b.status = 'open' AND l.delivered = 0`,
    [lineId, venueId],
  );
  return r.affectedRows === 1;
}

/** The guest's (or the waiter's) tip choice on an open bill. */
export async function setTip(db: Db, billId: number, choice: TipChoice) {
  await db.execute(
    "UPDATE bills SET tip_percent = ?, tip_fixed = ? WHERE id = ? AND status = 'open'",
    [choice.percent, choice.fixed ? 1 : 0, billId],
  );
}

/**
 * Finalises an open bill: its totals are fixed, the day's and the items' numbers are added up for
 * the reports (they stay after the bill is deleted), and the table is free for the next guests.
 * `day` is the venue's calendar day of the payment.
 */
export async function finalizeBill(
  db: PluginDatabase,
  venue: Venue,
  billId: number,
  payment: Payment,
  by: string,
  day: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const bill = await billWhere(tx, "id = ? AND venue_id = ? AND status = 'open' FOR UPDATE", [
      billId,
      venue.id,
    ]);
    if (!bill) return false;
    const t = billTotals(bill.lines, venue.tips, bill.tip);
    await tx.execute(
      `UPDATE bills SET status = 'final', finalized_at = UTC_TIMESTAMP(), finalized_by = ?,
              payment = ?, gross_minor = ?, tip_minor = ? WHERE id = ?`,
      [by, payment, t.gross, t.tip, billId],
    );
    const paid = t.total;
    await tx.execute(
      `INSERT INTO sales_days (venue_id, day, bills, gross_minor, net_minor, tip_minor,
                               cash_minor, card_minor, other_minor)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE bills = bills + 1, gross_minor = gross_minor + VALUES(gross_minor),
         net_minor = net_minor + VALUES(net_minor), tip_minor = tip_minor + VALUES(tip_minor),
         cash_minor = cash_minor + VALUES(cash_minor), card_minor = card_minor + VALUES(card_minor),
         other_minor = other_minor + VALUES(other_minor)`,
      [
        venue.id,
        day,
        t.gross,
        t.net,
        t.tip,
        payment === 'cash' ? paid : 0,
        payment === 'card' ? paid : 0,
        payment === 'other' ? paid : 0,
      ],
    );
    for (const l of bill.lines) {
      await tx.execute(
        `INSERT INTO sales_items (venue_id, month, name, qty, gross_minor) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty), gross_minor = gross_minor + VALUES(gross_minor)`,
        [venue.id, day.slice(0, 7), l.name, l.qty, l.priceMinor * l.qty],
      );
    }
    return true;
  });
}

/** The venue's bills (newest first), for the owner's search: by table, code, staff or item. */
export async function searchBills(db: Db, venueId: number, q: string, limit = 50) {
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db.query<{
    id: number;
    code: string;
    status: 'open' | 'final';
    table_name: string | null;
    opened_by: string;
    opened_at: Date;
    finalized_at: Date | null;
    payment: Payment | null;
    gross_minor: number | string;
    tip_minor: number | string;
  }>(
    `SELECT b.id, b.code, b.status, b.table_name, b.opened_by, b.opened_at, b.finalized_at,
            b.payment, b.gross_minor, b.tip_minor
       FROM bills b
      WHERE b.venue_id = ? AND (? = '' OR b.table_name LIKE ? OR b.code LIKE ? OR b.opened_by LIKE ?
            OR b.finalized_by LIKE ?
            OR EXISTS (SELECT 1 FROM bill_lines l WHERE l.bill_id = b.id AND l.name LIKE ?))
      ORDER BY b.opened_at DESC LIMIT ?`,
    [venueId, q, like, like, like, like, like, limit],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    code: r.code,
    status: r.status,
    tableName: r.table_name,
    openedBy: r.opened_by,
    openedAt: new Date(r.opened_at),
    finalizedAt: r.finalized_at ? new Date(r.finalized_at) : null,
    payment: r.payment,
    gross: Number(r.gross_minor),
    tip: Number(r.tip_minor),
  }));
}

/** The scheduled run: finalised bills older than BILL_KEEP_DAYS go (the numbers stay). */
export async function deleteOldBills(db: Db) {
  await db.execute(
    `DELETE FROM bills WHERE status = 'final'
        AND finalized_at < UTC_TIMESTAMP() - INTERVAL ? DAY LIMIT 5000`,
    [BILL_KEEP_DAYS],
  );
}

// --- the reports ---------------------------------------------------------------------------------

export async function salesDays(db: Db, venueId: number, from: string, to: string) {
  const rows = await db.query<{
    day: string;
    bills: number;
    gross_minor: number | string;
    net_minor: number | string;
    tip_minor: number | string;
    cash_minor: number | string;
    card_minor: number | string;
    other_minor: number | string;
  }>(
    `SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day, bills, gross_minor, net_minor, tip_minor,
            cash_minor, card_minor, other_minor
       FROM sales_days WHERE venue_id = ? AND day BETWEEN ? AND ? ORDER BY day`,
    [venueId, from, to],
  );
  return rows.map((r) => ({
    day: r.day,
    bills: Number(r.bills),
    gross: Number(r.gross_minor),
    net: Number(r.net_minor),
    tip: Number(r.tip_minor),
    cash: Number(r.cash_minor),
    card: Number(r.card_minor),
    other: Number(r.other_minor),
  }));
}

export async function topItems(db: Db, venueId: number, fromMonth: string, toMonth: string) {
  const rows = await db.query<{ name: string; qty: number | string; gross: number | string }>(
    `SELECT name, SUM(qty) AS qty, SUM(gross_minor) AS gross FROM sales_items
      WHERE venue_id = ? AND month BETWEEN ? AND ?
      GROUP BY name ORDER BY gross DESC LIMIT 100`,
    [venueId, fromMonth, toMonth],
  );
  return rows.map((r) => ({ name: r.name, qty: Number(r.qty), gross: Number(r.gross) }));
}

// --- staff on a tablet (ADR 0080) -----------------------------------------------------------------

export interface TabletStaff {
  id: number;
  name: string;
  role: StaffRole;
}

/** Who is on a tablet now (null when nobody switched in or the shift ran out). */
export async function staffOnTablet(db: Db, tabletId: number): Promise<TabletStaff | null> {
  const [r] = await db.query<{ id: number; name: string; role: StaffRole }>(
    `SELECT s.id, s.name, s.role FROM tablets t JOIN staff s ON s.id = t.staff_id
      WHERE t.id = ? AND t.revoked_at IS NULL AND s.active = 1
        AND t.staff_until > UTC_TIMESTAMP()`,
    [tabletId],
  );
  return r ? { id: Number(r.id), name: r.name, role: r.role } : null;
}

/** The staff to pick from on a tablet (names and roles only). */
export async function staffList(db: Db, venueId: number): Promise<TabletStaff[]> {
  const rows = await db.query<{ id: number; name: string; role: StaffRole }>(
    `SELECT id, name, role FROM staff
      WHERE venue_id = ? AND active = 1 AND pin_hash IS NOT NULL ORDER BY name`,
    [venueId],
  );
  return rows.map((r) => ({ id: Number(r.id), name: r.name, role: r.role }));
}

export type SwitchResult = 'ok' | 'wrong' | 'wait';

/** A staff member types their PIN on a tablet: on, or one more wrong try (then a wait). */
export async function switchStaff(
  db: Db,
  venueId: number,
  tabletId: number,
  staffId: number,
  pin: string,
): Promise<SwitchResult> {
  const [s] = await db.query<{ pin_hash: string | null; failures: number; locked: number }>(
    `SELECT pin_hash, pin_failures AS failures,
            (pin_locked_until IS NOT NULL AND pin_locked_until > UTC_TIMESTAMP()) AS locked
       FROM staff WHERE id = ? AND venue_id = ? AND active = 1`,
    [staffId, venueId],
  );
  if (!s) return 'wrong';
  if (Number(s.locked) === 1) return 'wait';
  if (!pinMatches(pin, s.pin_hash)) {
    const failures = Number(s.failures) + 1;
    await db.execute(
      `UPDATE staff SET pin_failures = ?,
              pin_locked_until = IF(? >= ?, UTC_TIMESTAMP() + INTERVAL ? MINUTE, NULL)
        WHERE id = ?`,
      [failures >= PIN_TRIES ? 0 : failures, failures, PIN_TRIES, PIN_WAIT_MINUTES, staffId],
    );
    return failures >= PIN_TRIES ? 'wait' : 'wrong';
  }
  await db.execute('UPDATE staff SET pin_failures = 0, pin_locked_until = NULL WHERE id = ?', [
    staffId,
  ]);
  await db.execute(
    `UPDATE tablets SET staff_id = ?, staff_until = UTC_TIMESTAMP() + INTERVAL ? HOUR
      WHERE id = ? AND venue_id = ?`,
    [staffId, TABLET_SHIFT_HOURS, tabletId, venueId],
  );
  return 'ok';
}

export async function leaveTablet(db: Db, tabletId: number) {
  await db.execute('UPDATE tablets SET staff_id = NULL, staff_until = NULL WHERE id = ?', [
    tabletId,
  ]);
}

export { netOf };
