import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { EventType } from './envelope';
import { deriveSecret, newPublicKey, newSalt, randomId, secretHint } from './keys';

// The member's API services and their settings (dashboard side). Every query is scoped to the
// owner; nothing is ever shared with another member (ADR 0023).

type Db = Omit<PluginDatabase, 'transaction'>;

export interface AppRow {
  id: number;
  user_id: number;
  name: string;
  public_key: string;
  secret_salt: string;
  secret_hint: string;
  prev_secret_salt: string | null;
  prev_secret_until: Date | null;
  secret_rotated_at: Date;
  browser_publish: number;
  strict_schema: number;
  allow_localhost: number;
  server_ips: string | null;
  paused: number;
  /** DevQuake's live demo service (ADR 0029); undefined before migration 0003. */
  demo?: number;
  created_at: Date;
}

export interface AppSummary {
  id: number;
  name: string;
  publicKey: string;
  paused: boolean;
  eventsToday: number;
  /** API calls ever made to this service (api_totals, kept when the log is cleaned). */
  calls: number;
  createdAt: string;
}

export interface OriginRow {
  id: number;
  origin: string;
  verifyToken: string;
  verifiedAt: string | null;
}

export interface UsageDay {
  day: string;
  events: number;
  rejected: number;
  streams: number;
  polls: number;
}

export interface SecurityEntry {
  id: number;
  kind: string;
  detail: string | null;
  at: string;
}

/** Grace period of the previous secret key after a rotation. */
export const PREVIOUS_SECRET_HOURS = 24;

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

export async function accountPlan(db: Db, userId: number): Promise<string | null> {
  const [row] = await db.query<{ plan: string }>('SELECT plan FROM accounts WHERE user_id = ?', [
    userId,
  ]);
  return row?.plan ?? null;
}

export async function listApps(db: Db, userId: number): Promise<AppSummary[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    public_key: string;
    paused: number;
    created_at: Date;
    events: number | null;
    calls: number | null;
  }>(
    `SELECT a.id, a.name, a.public_key, a.paused, a.created_at, u.events, t.calls
       FROM apps a
       LEFT JOIN usage_daily u ON u.app_id = a.id AND u.day = UTC_DATE()
       LEFT JOIN api_totals t ON t.app_id = a.id
      WHERE a.user_id = ? ORDER BY a.created_at`,
    [userId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    publicKey: r.public_key,
    paused: r.paused === 1,
    eventsToday: Number(r.events ?? 0),
    calls: Number(r.calls ?? 0),
    createdAt: iso(r.created_at)!,
  }));
}

export async function countApps(db: Db, userId: number): Promise<number> {
  const [row] = await db.query<{ n: number }>('SELECT COUNT(*) AS n FROM apps WHERE user_id = ?', [
    userId,
  ]);
  return Number(row?.n ?? 0);
}

/** Creates an app; returns its id and the secret key (shown once, never stored). */
export async function createApp(
  db: PluginDatabase,
  userId: number,
  name: string,
  master: Buffer,
): Promise<{ id: number; secret: string }> {
  return db.transaction(async (tx) => {
    const publicKey = newPublicKey();
    const salt = newSalt();
    const { insertId } = await tx.execute(
      `INSERT INTO apps (user_id, name, public_key, secret_salt, secret_hint)
       VALUES (?, ?, ?, ?, '????')`,
      [userId, name, publicKey, salt],
    );
    const secret = deriveSecret(master, insertId, publicKey, salt);
    await tx.execute('UPDATE apps SET secret_hint = ? WHERE id = ?', [
      secretHint(secret),
      insertId,
    ]);
    return { id: insertId, secret };
  });
}

/**
 * DevQuake's demo service (ADR 0029): owned by nobody (user_id 0), made on first use. Two
 * processes creating it at once only leave an unused second row; the oldest one is used.
 */
export async function demoApp(db: PluginDatabase, master: Buffer): Promise<AppRow> {
  const find = async () =>
    (await db.query<AppRow>('SELECT * FROM apps WHERE demo = 1 ORDER BY id LIMIT 1'))[0];
  const existing = await find();
  if (existing) return existing;
  const { id } = await createApp(db, 0, 'DevQuake live demo', master);
  await db.execute('UPDATE apps SET demo = 1 WHERE id = ?', [id]);
  return (await find())!;
}

/** The app when it belongs to `userId`, else null. */
export async function ownApp(db: Db, userId: number, id: number): Promise<AppRow | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const [row] = await db.query<AppRow>('SELECT * FROM apps WHERE id = ? AND user_id = ?', [
    id,
    userId,
  ]);
  return row ?? null;
}

export interface AppSettings {
  name?: string;
  browserPublish?: boolean;
  strictSchema?: boolean;
  allowLocalhost?: boolean;
  serverIps?: string[];
  paused?: boolean;
}

export async function updateApp(db: Db, id: number, s: AppSettings) {
  const sets: string[] = [];
  const values: unknown[] = [];
  const put = (column: string, value: unknown) => {
    sets.push(`${column} = ?`);
    values.push(value);
  };
  if (s.name !== undefined) put('name', s.name);
  if (s.browserPublish !== undefined) put('browser_publish', s.browserPublish ? 1 : 0);
  if (s.strictSchema !== undefined) put('strict_schema', s.strictSchema ? 1 : 0);
  if (s.allowLocalhost !== undefined) put('allow_localhost', s.allowLocalhost ? 1 : 0);
  if (s.serverIps !== undefined)
    put('server_ips', s.serverIps.length ? s.serverIps.join(',') : null);
  if (s.paused !== undefined) put('paused', s.paused ? 1 : 0);
  if (sets.length === 0) return;
  await db.execute(`UPDATE apps SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
}

/** A new secret key; the previous one keeps working for PREVIOUS_SECRET_HOURS. */
export async function rotateSecret(db: Db, app: AppRow, master: Buffer): Promise<string> {
  const salt = newSalt();
  const secret = deriveSecret(master, app.id, app.public_key, salt);
  await db.execute(
    `UPDATE apps SET prev_secret_salt = secret_salt,
            prev_secret_until = UTC_TIMESTAMP() + INTERVAL ? HOUR,
            secret_salt = ?, secret_hint = ?, secret_rotated_at = UTC_TIMESTAMP()
      WHERE id = ?`,
    [PREVIOUS_SECRET_HOURS, salt, secretHint(secret), app.id],
  );
  await logSecurity(db, app.id, 'secret_rotated', null);
  return secret;
}

/** Removes an app and everything it produced. */
export async function deleteApps(db: PluginDatabase, ids: number[]) {
  if (ids.length === 0) return;
  const marks = ids.map(() => '?').join(', ');
  await db.transaction(async (tx) => {
    for (const table of [
      'events',
      'usage_daily',
      'server_ips',
      'security_log',
      'streams',
      // The service's call log and its own totals; the all-services total (app_id 0) stays.
      'api_calls',
      'api_totals',
    ]) {
      await tx.execute(`DELETE FROM ${table} WHERE app_id IN (${marks})`, ids);
    }
    await tx.execute(`DELETE FROM apps WHERE id IN (${marks})`, ids);
  });
}

// ---- Websites ----------------------------------------------------------------------------------

export async function listOrigins(db: Db, appId: number): Promise<OriginRow[]> {
  const rows = await db.query<{
    id: number;
    origin: string;
    verify_token: string;
    verified_at: Date | null;
  }>('SELECT id, origin, verify_token, verified_at FROM app_origins WHERE app_id = ? ORDER BY id', [
    appId,
  ]);
  return rows.map((r) => ({
    id: Number(r.id),
    origin: r.origin,
    verifyToken: r.verify_token,
    verifiedAt: iso(r.verified_at),
  }));
}

/** Adds a website (unverified); false when it is already there. */
export async function addOrigin(db: Db, appId: number, origin: string): Promise<boolean> {
  const { affectedRows } = await db.execute(
    'INSERT IGNORE INTO app_origins (app_id, origin, verify_token) VALUES (?, ?, ?)',
    [appId, origin, randomId(32)],
  );
  return affectedRows === 1;
}

export async function removeOrigin(db: Db, appId: number, originId: number) {
  await db.execute('DELETE FROM app_origins WHERE id = ? AND app_id = ?', [originId, appId]);
}

export async function markOriginVerified(db: Db, appId: number, originId: number) {
  await db.execute(
    'UPDATE app_origins SET verified_at = UTC_TIMESTAMP() WHERE id = ? AND app_id = ?',
    [originId, appId],
  );
}

// ---- Event types (the member's key:value structures) ---------------------------------------------

export async function listEventTypes(db: Db, appId: number): Promise<EventType[]> {
  const rows = await db.query<{ name: string; fields: string }>(
    'SELECT name, fields FROM event_types WHERE app_id = ? ORDER BY name',
    [appId],
  );
  return rows.map((r) => ({ name: r.name, fields: JSON.parse(r.fields) }));
}

export async function replaceEventTypes(db: PluginDatabase, appId: number, types: EventType[]) {
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM event_types WHERE app_id = ?', [appId]);
    for (const t of types) {
      await tx.execute('INSERT INTO event_types (app_id, name, fields) VALUES (?, ?, ?)', [
        appId,
        t.name,
        JSON.stringify(t.fields),
      ]);
    }
  });
}

// ---- Usage and security ----------------------------------------------------------------------

/** The last `days` UTC days (today first), zero where nothing happened. */
export async function usage(db: Db, appId: number, days = 7): Promise<UsageDay[]> {
  const rows = await db.query<{
    day: Date | string;
    events: number;
    rejected: number;
    streams: number;
    polls: number;
  }>(
    `SELECT day, events, rejected, streams, polls FROM usage_daily
      WHERE app_id = ? AND day > UTC_DATE() - INTERVAL ? DAY ORDER BY day DESC`,
    [appId, days],
  );
  const byDay = new Map(rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r]));
  const out: UsageDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const r = byDay.get(day);
    out.push({
      day,
      events: Number(r?.events ?? 0),
      rejected: Number(r?.rejected ?? 0),
      streams: Number(r?.streams ?? 0),
      polls: Number(r?.polls ?? 0),
    });
  }
  return out;
}

/** Different addresses the secret key was used from today. */
export async function serverAddressesToday(db: Db, appId: number): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM server_ips WHERE app_id = ? AND day = UTC_DATE()',
    [appId],
  );
  return Number(row?.n ?? 0);
}

export async function openStreams(db: Db, appId: number): Promise<number> {
  const [row] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM streams WHERE app_id = ? AND seen_at > UTC_TIMESTAMP() - INTERVAL 90 SECOND',
    [appId],
  );
  return Number(row?.n ?? 0);
}

export async function securityLog(db: Db, appId: number, limit = 20): Promise<SecurityEntry[]> {
  const rows = await db.query<{
    id: number;
    kind: string;
    detail: string | null;
    created_at: Date;
  }>(
    'SELECT id, kind, detail, created_at FROM security_log WHERE app_id = ? ORDER BY id DESC LIMIT ?',
    [appId, limit],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    kind: r.kind,
    detail: r.detail,
    at: iso(r.created_at)!,
  }));
}

export async function logSecurity(db: Db, appId: number, kind: string, detail: string | null) {
  await db.execute('INSERT INTO security_log (app_id, kind, detail) VALUES (?, ?, ?)', [
    appId,
    kind,
    detail?.slice(0, 200) ?? null,
  ]);
}
