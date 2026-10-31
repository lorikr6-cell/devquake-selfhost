import type { PluginDatabase } from '@devquake/plugin-sdk';
import { newVapidKeys, sendPush, type VapidKeys } from './webpush';

// Waiters' sections, guests calling the waiter, and browser push (venue migration 0008). Every
// function takes the venue from its caller.

type Db = Omit<PluginDatabase, 'transaction'>;

/** A guest may raise a hand again this long after the last call of the table. */
export const CALL_COOLDOWN_SECONDS = 45;
/** Calls are kept this long for the history. */
export const CALL_KEEP_DAYS = 30;

// --- sections and assignment -------------------------------------------------------------------

/** The owner gives a table to a waiter's section (null: no section). */
export async function setSection(db: Db, venueId: number, tableId: number, staffId: number | null) {
  const r = await db.execute(
    `UPDATE venue_tables t SET t.waiter_staff_id = IF(? IS NULL, NULL,
        (SELECT s.id FROM staff s WHERE s.id = ? AND s.venue_id = t.venue_id AND s.active = 1))
      WHERE t.id = ? AND t.venue_id = ?`,
    [staffId, staffId, tableId, venueId],
  );
  return r.affectedRows === 1;
}

/** Waiters (and managers) switched in on a tablet now. */
async function onShift(db: Db, venueId: number) {
  return db.query<{ id: number; name: string; open: number }>(
    `SELECT s.id, s.name,
            (SELECT COUNT(*) FROM bills b WHERE b.venue_id = s.venue_id AND b.status = 'open'
                AND b.waiter_staff_id = s.id) AS open
       FROM staff s JOIN tablets t ON t.staff_id = s.id AND t.revoked_at IS NULL
      WHERE s.venue_id = ? AND s.active = 1 AND s.role IN ('waiter', 'manager')
        AND t.staff_until > UTC_TIMESTAMP()
      GROUP BY s.id`,
    [venueId],
  );
}

/**
 * The waiter for a table (owner's rule): the waiter of its section when they are on shift, else
 * the waiter on shift with the fewest open tables; null when nobody is on shift.
 */
export async function waiterFor(db: Db, venueId: number, tableId: number) {
  const [table] = await db.query<{ waiter_staff_id: number | null }>(
    'SELECT waiter_staff_id FROM venue_tables WHERE id = ? AND venue_id = ?',
    [tableId, venueId],
  );
  const shift = await onShift(db, venueId);
  const own = shift.find((s) => Number(s.id) === Number(table?.waiter_staff_id));
  if (own) return { id: Number(own.id), name: own.name };
  const free = shift.sort(
    (a, b) => Number(a.open) - Number(b.open) || Number(a.id) - Number(b.id),
  )[0];
  return free ? { id: Number(free.id), name: free.name } : null;
}

/** Gives an open bill to a waiter (assignment or a hand-over); null clears it. */
export async function setBillWaiter(
  db: Db,
  venueId: number,
  billId: number,
  waiter: { id: number; name: string } | null,
) {
  const r = await db.execute(
    "UPDATE bills SET waiter_staff_id = ?, waiter_name = ? WHERE id = ? AND venue_id = ? AND status = 'open'",
    [waiter?.id ?? null, waiter?.name ?? null, billId, venueId],
  );
  return r.affectedRows === 1;
}

/** The waiters a table can be handed to (names only). */
export async function waiters(db: Db, venueId: number) {
  const rows = await db.query<{ id: number; name: string }>(
    `SELECT id, name FROM staff WHERE venue_id = ? AND active = 1 AND role IN ('waiter', 'manager')
      ORDER BY name`,
    [venueId],
  );
  return rows.map((r) => ({ id: Number(r.id), name: r.name }));
}

// --- calls -------------------------------------------------------------------------------------

export interface Call {
  id: number;
  tableId: number;
  tableName: string;
  waiterStaffId: number | null;
  status: 'open' | 'coming' | 'done';
  createdAt: string;
  answeredAt: string | null;
  answeredBy: string | null;
}

const toCall = (r: {
  id: number;
  table_id: number;
  table_name: string;
  waiter_staff_id: number | null;
  status: Call['status'];
  created_at: Date;
  answered_at: Date | null;
  answered_by: string | null;
}): Call => ({
  id: Number(r.id),
  tableId: Number(r.table_id),
  tableName: r.table_name,
  waiterStaffId: r.waiter_staff_id === null ? null : Number(r.waiter_staff_id),
  status: r.status,
  createdAt: new Date(r.created_at).toISOString(),
  answeredAt: r.answered_at ? new Date(r.answered_at).toISOString() : null,
  answeredBy: r.answered_by,
});

const CALL_COLS =
  'id, table_id, table_name, waiter_staff_id, status, created_at, answered_at, answered_by';

/**
 * A guest raises a hand at a table: a new call for the table's waiter, unless one is still open
 * or the last one is younger than CALL_COOLDOWN_SECONDS (then that one is returned).
 */
export async function raiseHand(
  db: Db,
  venueId: number,
  table: { id: number; name: string },
  waiterStaffId: number | null,
): Promise<{ call: Call; created: boolean }> {
  const [last] = await db.query<Parameters<typeof toCall>[0] & { recent: number }>(
    `SELECT ${CALL_COLS}, created_at > UTC_TIMESTAMP() - INTERVAL ? SECOND AS recent
       FROM venue_calls WHERE venue_id = ? AND table_id = ? ORDER BY id DESC LIMIT 1`,
    [CALL_COOLDOWN_SECONDS, venueId, table.id],
  );
  if (last && (last.status !== 'done' || Number(last.recent) === 1))
    return { call: toCall(last), created: false };
  const r = await db.execute(
    'INSERT INTO venue_calls (venue_id, table_id, table_name, waiter_staff_id) VALUES (?, ?, ?, ?)',
    [venueId, table.id, table.name, waiterStaffId],
  );
  const [row] = await db.query<Parameters<typeof toCall>[0]>(
    `SELECT ${CALL_COLS} FROM venue_calls WHERE id = ?`,
    [r.insertId],
  );
  return { call: toCall(row!), created: true };
}

/** The table's latest call (what the guest sees: on the way, or nothing open). */
export async function lastCallOfTable(db: Db, venueId: number, tableId: number) {
  const [r] = await db.query<Parameters<typeof toCall>[0]>(
    `SELECT ${CALL_COLS} FROM venue_calls WHERE venue_id = ? AND table_id = ? ORDER BY id DESC LIMIT 1`,
    [venueId, tableId],
  );
  return r ? toCall(r) : null;
}

/** Open calls (and those on the way) of the venue, oldest first. */
export async function openCalls(db: Db, venueId: number) {
  const rows = await db.query<Parameters<typeof toCall>[0]>(
    `SELECT ${CALL_COLS} FROM venue_calls WHERE venue_id = ? AND status <> 'done'
      ORDER BY created_at LIMIT 100`,
    [venueId],
  );
  return rows.map(toCall);
}

/** The history: the venue's calls, newest first (the notification list). */
export async function callHistory(db: Db, venueId: number, limit = 200) {
  const rows = await db.query<Parameters<typeof toCall>[0]>(
    `SELECT ${CALL_COLS} FROM venue_calls WHERE venue_id = ? ORDER BY id DESC LIMIT ?`,
    [venueId, limit],
  );
  return rows.map(toCall);
}

/** A waiter answers a call: on the way, or done. */
export async function answerCall(
  db: Db,
  venueId: number,
  callId: number,
  status: 'coming' | 'done',
  by: string,
) {
  const r = await db.execute(
    `UPDATE venue_calls SET status = ?, answered_at = COALESCE(answered_at, UTC_TIMESTAMP()),
            answered_by = COALESCE(answered_by, ?)
      WHERE id = ? AND venue_id = ? AND status <> 'done'`,
    [status, by, callId, venueId],
  );
  return r.affectedRows === 1;
}

/** The scheduled run: calls older than CALL_KEEP_DAYS go. */
export async function deleteOldCalls(db: Db) {
  await db.execute(
    'DELETE FROM venue_calls WHERE created_at < UTC_TIMESTAMP() - INTERVAL ? DAY LIMIT 5000',
    [CALL_KEEP_DAYS],
  );
}

// --- browser push ------------------------------------------------------------------------------

/** The app's VAPID keys, made and kept on first use. */
export async function vapidKeys(db: Db): Promise<VapidKeys> {
  const [r] = await db.query<{ public_key: string; private_key: string }>(
    'SELECT public_key, private_key FROM push_keys WHERE id = 1',
  );
  if (r) return { publicKey: r.public_key, privateKey: r.private_key };
  const keys = newVapidKeys();
  await db.execute('INSERT IGNORE INTO push_keys (id, public_key, private_key) VALUES (1, ?, ?)', [
    keys.publicKey,
    keys.privateKey,
  ]);
  const [kept] = await db.query<{ public_key: string; private_key: string }>(
    'SELECT public_key, private_key FROM push_keys WHERE id = 1',
  );
  return { publicKey: kept!.public_key, privateKey: kept!.private_key };
}

const B64U = /^[A-Za-z0-9_-]+$/;

/** A browser's subscription for a waiter (or the owner) of the venue; replaces the same device. */
export async function addSubscription(
  db: Db,
  venueId: number,
  who: { staffId: number | null; owner: boolean },
  sub: { endpoint: unknown; p256dh: unknown; auth: unknown },
): Promise<boolean> {
  const endpoint = String(sub.endpoint ?? '');
  const p256dh = String(sub.p256dh ?? '');
  const auth = String(sub.auth ?? '');
  if (!endpoint.startsWith('https://') || endpoint.length > 500) return false;
  if (!B64U.test(p256dh) || p256dh.length > 120 || !B64U.test(auth) || auth.length > 40)
    return false;
  await db.execute(
    `INSERT INTO push_subscriptions (venue_id, staff_id, is_owner, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE venue_id = VALUES(venue_id), staff_id = VALUES(staff_id),
       is_owner = VALUES(is_owner), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
    [venueId, who.staffId, who.owner ? 1 : 0, endpoint, p256dh, auth],
  );
  return true;
}

export async function removeSubscription(db: Db, venueId: number, endpoint: string) {
  await db.execute('DELETE FROM push_subscriptions WHERE venue_id = ? AND endpoint = ?', [
    venueId,
    endpoint.slice(0, 500),
  ]);
}

/**
 * Tells the waiter's devices (or, when the table has no waiter, every device of the venue) that a
 * table is calling. Browsers that dropped the subscription are forgotten. At most 10 devices.
 */
export async function pushCall(
  db: Db,
  venueId: number,
  call: Call,
  message: { title: string; body: string; url: string },
) {
  const rows = await db.query<{ endpoint: string; p256dh: string; auth: string }>(
    call.waiterStaffId === null
      ? 'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE venue_id = ? LIMIT 10'
      : `SELECT endpoint, p256dh, auth FROM push_subscriptions
          WHERE venue_id = ? AND (staff_id = ? OR is_owner = 1) LIMIT 10`,
    call.waiterStaffId === null ? [venueId] : [venueId, call.waiterStaffId],
  );
  if (!rows.length) return;
  const keys = await vapidKeys(db);
  await Promise.all(
    rows.map(async (r) => {
      const result = await sendPush(keys, r, { ...message, tag: `call-${call.tableId}` });
      if (result === 'gone') await removeSubscription(db, venueId, r.endpoint);
    }),
  );
}
