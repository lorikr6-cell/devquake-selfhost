import { DEMO_KEEP_MINUTES } from './lib/demo';
import type { PluginPlatformModule } from '@devquake/plugin-sdk';

/** Hooks the platform calls (ADR 0007, 0014, 0023). */

export const getStats: PluginPlatformModule['getStats'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{
    apps: number;
    owners: number;
    eventsToday: number;
    rejectedToday: number;
    streams: number;
  }>(
    `SELECT (SELECT COUNT(*) FROM apps WHERE demo = 0) AS apps,
            (SELECT COUNT(DISTINCT user_id) FROM apps WHERE demo = 0) AS owners,
            (SELECT COALESCE(SUM(events), 0) FROM usage_daily WHERE day = UTC_DATE()) AS eventsToday,
            (SELECT COALESCE(SUM(rejected), 0) FROM usage_daily WHERE day = UTC_DATE()) AS rejectedToday,
            (SELECT COUNT(*) FROM streams WHERE seen_at > UTC_TIMESTAMP() - INTERVAL 90 SECOND) AS streams`,
  );
  return [
    { label: 'API services', value: Number(row?.apps ?? 0) },
    { label: 'Members with services', value: Number(row?.owners ?? 0) },
    { label: 'Events today', value: Number(row?.eventsToday ?? 0) },
    { label: 'Refused today', value: Number(row?.rejectedToday ?? 0) },
    { label: 'Live connections now', value: Number(row?.streams ?? 0) },
  ];
};

/**
 * Removes everything Pulse keeps about a person, on account deletion, on unsubscribing and after
 * an unused trial: their API services with all events, usage, websites, event types, security
 * log and connections, and their plan row.
 */
export const deleteUserData: PluginPlatformModule['deleteUserData'] = async (userId, { db }) => {
  if (!db) {
    if (process.env.PULSE_DB_NAME) throw new Error('pulse database unavailable');
    return;
  }
  const { deleteApps } = await import('./lib/data');
  const apps = await db.query<{ id: number }>('SELECT id FROM apps WHERE user_id = ?', [userId]);
  await deleteApps(
    db,
    apps.map((a) => Number(a.id)),
  );
  await db.execute('DELETE FROM accounts WHERE user_id = ?', [userId]);
};

/**
 * Housekeeping (every few minutes): events older than the longest history (7 days; the API
 * only returns events inside each plan's own history), usage older than 35 days, security entries
 * older than 30 days, connections that stopped reporting. In batches, so each run stays short.
 */
export const scheduled: PluginPlatformModule['scheduled'] = async ({ db }) => {
  if (!db) return;
  // The live demo keeps its events for an hour only (ADR 0029).
  await db
    .execute(
      `DELETE e FROM events e JOIN apps a ON a.id = e.app_id
        WHERE a.demo = 1 AND e.created_at < UTC_TIMESTAMP() - INTERVAL ${DEMO_KEEP_MINUTES} MINUTE`,
    )
    .catch(() => undefined); // before migration 0003 there is no demo yet
  await db.execute(
    'DELETE FROM events WHERE created_at < UTC_TIMESTAMP() - INTERVAL 7 DAY ORDER BY id LIMIT 5000',
  );
  // Trial and standard history is shorter: those events go after a day.
  await db.execute(
    `DELETE e FROM events e JOIN apps a ON a.id = e.app_id
       LEFT JOIN accounts ac ON ac.user_id = a.user_id
      WHERE e.created_at < UTC_TIMESTAMP() - INTERVAL 1 DAY AND COALESCE(ac.plan, 'standard') <> 'full'`,
  );
  await db.execute('DELETE FROM usage_daily WHERE day < UTC_DATE() - INTERVAL 35 DAY');
  await db.execute('DELETE FROM server_ips WHERE day < UTC_DATE() - INTERVAL 35 DAY');
  await db.execute(
    'DELETE FROM security_log WHERE created_at < UTC_TIMESTAMP() - INTERVAL 30 DAY LIMIT 5000',
  );
  await db.execute('DELETE FROM streams WHERE seen_at < UTC_TIMESTAMP() - INTERVAL 5 MINUTE');
  await db.execute(
    'UPDATE apps SET prev_secret_salt = NULL, prev_secret_until = NULL WHERE prev_secret_until < UTC_TIMESTAMP()',
  );
  // The API call log, at the interval an admin chose (the totals stay).
  const { autoCleanLog } = await import('./lib/call-log');
  await autoCleanLog(db);
};

/** Public totals for the app's card and front page (ADR 0038): counts only, never about a person. */
export const getHighlights: PluginPlatformModule['getHighlights'] = async ({ db }) => {
  if (!db) return [];
  const [row] = await db.query<{ apps: number | string; events: number | string }>(
    `SELECT (SELECT COUNT(*) FROM apps WHERE demo = 0) AS apps,
            (SELECT COALESCE(SUM(events), 0) FROM usage_daily WHERE day = UTC_DATE()) AS events`,
  );
  const n = (v: number | string | undefined) => Number(v ?? 0);
  return [
    {
      value: n(row?.apps),
      label: { en: 'API services', de: 'API-Dienste', ro: 'Servicii API', hu: 'API-szolgáltatás' },
      icon: '📡',
    },
    {
      value: n(row?.events),
      label: {
        en: 'Events today',
        de: 'Ereignisse heute',
        ro: 'Evenimente azi',
        hu: 'Mai esemény',
      },
      icon: '⚡',
    },
  ];
};
