// Waiters' phones (ADR 0083): the owner shows a one-time pairing code as a QR; the Venue app
// redeems it and becomes one of the venue's devices (a tablet of kind 'phone', its token kept
// only as a hash), then the waiter switches in with their PIN like on a tablet.

import { randomInt } from 'node:crypto';
import type { PluginDatabase as Db } from '@devquake/plugin-sdk';
import type { Call } from './calls';
import { sendToPhones } from './phone-push';
import { newTabletToken, tokenHash } from './secure';

/** No 0/O, 1/I/L: easy to type from the screen. */
export const PAIR_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const PAIR_LENGTH = 10;
export const PAIR_MINUTES = 10;
/** Open codes per venue at a time. */
const PAIR_MAX_OPEN = 5;

export function newPairCode(): string {
  let code = '';
  for (let i = 0; i < PAIR_LENGTH; i++) code += PAIR_ALPHABET[randomInt(PAIR_ALPHABET.length)];
  return code;
}

/** A typed or scanned code in its stored form (upper case, no spaces or dashes); null if off. */
export function normalizePairCode(raw: unknown): string | null {
  const code = String(raw ?? '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
  if (code.length !== PAIR_LENGTH) return null;
  for (const c of code) if (!PAIR_ALPHABET.includes(c)) return null;
  return code;
}

/** What the QR holds: the app opens it and talks to this server (self-hosted ones too). */
export const pairLink = (baseUrl: string, code: string) =>
  `devquake-venue://pair?server=${encodeURIComponent(baseUrl)}&code=${code}`;

/** A pairing code for a phone named `name`, valid PAIR_MINUTES; null when 5 are open. */
export async function createPairing(
  db: Db,
  venueId: number,
  name: string,
  userId: number,
): Promise<{ code: string; expiresAt: string } | null> {
  await db.execute('DELETE FROM phone_pairings WHERE expires_at < UTC_TIMESTAMP()');
  const [open] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM phone_pairings WHERE venue_id = ?',
    [venueId],
  );
  if (Number(open?.n ?? 0) >= PAIR_MAX_OPEN) return null;
  const code = newPairCode();
  const expires = new Date(Date.now() + PAIR_MINUTES * 60_000);
  await db.execute(
    `INSERT INTO phone_pairings (venue_id, name, code_hash, expires_at, created_by)
     VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? MINUTE, ?)`,
    [venueId, name, tokenHash(code), PAIR_MINUTES, userId],
  );
  return { code, expiresAt: expires.toISOString() };
}

/** Redeems a code once: the phone's token (only its hash is kept) and its venue. */
export async function redeemPairing(
  db: Db,
  code: string,
): Promise<{ token: string; venueId: number; name: string } | null> {
  const [p] = await db.query<{ id: number; venue_id: number; name: string; created_by: number }>(
    `SELECT id, venue_id, name, created_by FROM phone_pairings
      WHERE code_hash = ? AND expires_at >= UTC_TIMESTAMP()`,
    [tokenHash(code)],
  );
  if (!p) return null;
  // Deleting first makes the code single-use even when two phones race for it.
  const gone = await db.execute('DELETE FROM phone_pairings WHERE id = ?', [p.id]);
  if (gone.affectedRows !== 1) return null;
  const token = newTabletToken();
  await db.execute(
    `INSERT INTO tablets (venue_id, name, kind, token_hash, created_by, last_used_at)
     VALUES (?, ?, 'phone', ?, ?, UTC_TIMESTAMP())`,
    [p.venue_id, p.name, tokenHash(token), p.created_by],
  );
  return { token, venueId: Number(p.venue_id), name: p.name };
}

/** The phone's push address from Google or Apple (one per phone; replaced when it changes). */
export async function savePhonePush(
  db: Db,
  venueId: number,
  tabletId: number,
  platform: 'fcm' | 'apns',
  token: string,
) {
  await db.execute(
    `INSERT INTO phone_push (tablet_id, venue_id, platform, token) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE platform = VALUES(platform), token = VALUES(token),
       updated_at = UTC_TIMESTAMP()`,
    [tabletId, venueId, platform, token],
  );
}

export async function removePhonePush(db: Db, tabletId: number) {
  await db.execute('DELETE FROM phone_push WHERE tablet_id = ?', [tabletId]);
}

/**
 * A guest's call to the phones of the waiter on shift who looks after the table (anyone on a
 * phone when the table has no waiter); at most 10 phones. Gone addresses are deleted.
 */
export async function pushPhones(
  db: Db,
  venueId: number,
  call: Pick<Call, 'id' | 'tableId' | 'tableName' | 'waiterStaffId'>,
  kind: 'call' | 'order' = 'call',
) {
  // Only who has something to do with it (owner's rule), in this venue only: the phone of the
  // table's waiter when it has one; otherwise the phones of every waiter and manager on shift
  // (never the kitchen's or the bar's).
  const rows = await db.query<{ platform: 'fcm' | 'apns'; token: string }>(
    call.waiterStaffId === null
      ? `SELECT p.platform, p.token FROM phone_push p
           JOIN tablets t ON t.id = p.tablet_id AND t.venue_id = p.venue_id
           JOIN staff s ON s.id = t.staff_id AND s.venue_id = p.venue_id
          WHERE p.venue_id = ? AND t.revoked_at IS NULL AND t.staff_until > UTC_TIMESTAMP()
            AND s.active = 1 AND s.role IN ('waiter', 'manager')
          LIMIT 10`
      : `SELECT p.platform, p.token FROM phone_push p
           JOIN tablets t ON t.id = p.tablet_id AND t.venue_id = p.venue_id
          WHERE p.venue_id = ? AND t.revoked_at IS NULL AND t.staff_until > UTC_TIMESTAMP()
            AND t.staff_id = ?
          LIMIT 10`,
    call.waiterStaffId === null ? [venueId] : [venueId, call.waiterStaffId],
  );
  if (!rows.length) return;
  const gone = await sendToPhones(rows, {
    kind,
    callId: call.id,
    tableId: call.tableId,
    tableName: call.tableName,
  });
  for (const token of gone)
    await db.execute('DELETE FROM phone_push WHERE venue_id = ? AND token = ?', [venueId, token]);
}
