import type { PluginDatabase } from '@devquake/plugin-sdk';
import { parseCleanupDays, type CleanupDays } from './call-rules';

type Db = Omit<PluginDatabase, 'transaction'>;

/** The platform-wide totals row in api_totals (every call ever made to Pulse). */
export const ALL_SERVICES = 0;
const BATCH = 20_000;

export interface CallRecord {
  appId: number | null;
  method: string;
  route: string;
  status: number;
  source: string | null;
  durationMs: number;
}

/**
 * Logs one developer API call and adds it to the totals (for everything, and for its API
 * service when the key was recognised). Refused = any 4xx/5xx answer. Never throws: counting
 * must not break the API.
 */
export async function recordCall(db: Db, call: CallRecord): Promise<void> {
  const refused = call.status >= 400 ? 1 : 0;
  try {
    await db.execute(
      `INSERT INTO api_calls (app_id, method, route, status, source, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        call.appId,
        call.method.slice(0, 8),
        call.route.slice(0, 40),
        call.status,
        call.source,
        Math.max(0, Math.round(call.durationMs)),
      ],
    );
    const rows = call.appId ? [ALL_SERVICES, call.appId] : [ALL_SERVICES];
    await db.execute(
      `INSERT INTO api_totals (app_id, calls, refused, first_at, last_at)
       VALUES ${rows.map(() => '(?, 1, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())').join(', ')}
       ON DUPLICATE KEY UPDATE calls = calls + 1, refused = refused + VALUES(refused),
                               last_at = UTC_TIMESTAMP()`,
      rows.flatMap((id) => [id, refused]),
    );
  } catch (err) {
    console.error('[pulse] could not record an API call', err);
  }
}

export interface CallTotals {
  calls: number;
  refused: number;
  firstAt: string | null;
  lastAt: string | null;
}

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

/** Totals of one API service, or of everything (ALL_SERVICES). Kept when the log is cleaned. */
export async function callTotals(db: Db, appId: number): Promise<CallTotals> {
  const [row] = await db
    .query<{ calls: number; refused: number; first_at: Date; last_at: Date | null }>(
      'SELECT calls, refused, first_at, last_at FROM api_totals WHERE app_id = ?',
      [appId],
    )
    .catch(() => []);
  return {
    calls: Number(row?.calls ?? 0),
    refused: Number(row?.refused ?? 0),
    firstAt: iso(row?.first_at ?? null),
    lastAt: iso(row?.last_at ?? null),
  };
}

export interface LoggedCall {
  id: number;
  at: string;
  method: string;
  route: string;
  status: number;
  source: string | null;
  durationMs: number;
}

/** The newest calls of one API service (its owner's page). */
export async function recentCalls(db: Db, appId: number, limit = 25): Promise<LoggedCall[]> {
  const rows = await db
    .query<{
      id: number;
      called_at: Date;
      method: string;
      route: string;
      status: number;
      source: string | null;
      duration_ms: number;
    }>(
      `SELECT id, called_at, method, route, status, source, duration_ms FROM api_calls
        WHERE app_id = ? ORDER BY id DESC LIMIT ${Math.min(100, Math.max(1, limit))}`,
      [appId],
    )
    .catch(() => []);
  return rows.map((r) => ({
    id: Number(r.id),
    at: iso(r.called_at)!,
    method: r.method,
    route: r.route,
    status: Number(r.status),
    source: r.source,
    durationMs: Number(r.duration_ms),
  }));
}

export interface LogInfo {
  entries: number;
  oldest: string | null;
  cleanupDays: CleanupDays;
  lastCleanup: { at: string; removed: number; auto: boolean } | null;
}

/** The size of the call log and how it is cleaned (admins). */
export async function logInfo(db: Db): Promise<LogInfo> {
  const [[size], days, last] = await Promise.all([
    db.query<{ n: number; oldest: Date | null }>(
      'SELECT COUNT(*) AS n, MIN(called_at) AS oldest FROM api_calls',
    ),
    setting(db, 'call_log_days'),
    setting(db, 'call_log_last_cleanup'),
  ]);
  let lastCleanup: LogInfo['lastCleanup'] = null;
  try {
    lastCleanup = last ? (JSON.parse(last) as LogInfo['lastCleanup']) : null;
  } catch {
    lastCleanup = null;
  }
  return {
    entries: Number(size?.n ?? 0),
    oldest: iso(size?.oldest ?? null),
    cleanupDays: parseCleanupDays(days ?? '30') ?? 30,
    lastCleanup,
  };
}

async function setting(db: Db, name: string): Promise<string | null> {
  const [row] = await db.query<{ value: string }>('SELECT value FROM settings WHERE name = ?', [
    name,
  ]);
  return row?.value ?? null;
}

async function saveSetting(db: Db, name: string, value: string, userId: number | null) {
  await db.execute(
    `INSERT INTO settings (name, value, updated_by) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)`,
    [name, value, userId],
  );
}

export async function setCleanupDays(db: Db, days: CleanupDays, userId: number) {
  await saveSetting(db, 'call_log_days', String(days), userId);
}

/**
 * Removes log entries older than `olderThanDays` (0 = all of them), in batches. The totals are
 * not touched. Returns how many entries went.
 */
export async function cleanLog(
  db: Db,
  olderThanDays: number,
  by: { userId: number | null; auto: boolean },
  maxBatches = 50,
): Promise<number> {
  const where =
    olderThanDays > 0
      ? `WHERE called_at < UTC_TIMESTAMP() - INTERVAL ${Math.floor(olderThanDays)} DAY`
      : '';
  let removed = 0;
  for (let i = 0; i < maxBatches; i += 1) {
    const { affectedRows } = await db.execute(
      `DELETE FROM api_calls ${where} ORDER BY id LIMIT ${BATCH}`,
    );
    removed += affectedRows;
    if (affectedRows < BATCH) break;
  }
  if (removed > 0 || !by.auto) {
    await saveSetting(
      db,
      'call_log_last_cleanup',
      JSON.stringify({ at: new Date().toISOString(), removed, auto: by.auto }),
      by.userId,
    );
  }
  return removed;
}

/** The scheduled clean-up (platform.ts): entries older than the chosen interval. */
export async function autoCleanLog(db: Db): Promise<void> {
  const days = Number((await setting(db, 'call_log_days').catch(() => null)) ?? 30);
  if (!days) return;
  await cleanLog(db, days, { userId: null, auto: true }, 5);
}
