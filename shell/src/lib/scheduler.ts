import 'server-only';
import { APP, PLUGIN_IDS, loadPlugin } from '@/generated/app';
import { database, queryOne } from './db';
import { configuredPublicUrl, domainSetting } from './env';
import { appOrigin } from './hosts';
import { pluginMailer } from './mail';

// The app's background work (reminders, monthly emails) once an hour, as DevQuake's host does
// from traffic (ADR 0014). The last run is kept in the database, so restarts do not repeat it.

const HOUR = 3_600_000;
const g = globalThis as unknown as { dqTimer?: NodeJS.Timeout; dqRunning?: boolean };

async function lastActiveAt(userIds: number[]) {
  const out: Record<number, string | null> = {};
  if (userIds.length === 0) return out;
  const rows = await database().query<{ id: number; last_seen_at: Date | string | null }>(
    `SELECT id, last_seen_at FROM dq_users WHERE id IN (${userIds.map(() => '?').join(',')})`,
    userIds,
  );
  for (const id of userIds) out[id] = null;
  for (const r of rows) {
    out[Number(r.id)] = r.last_seen_at ? new Date(r.last_seen_at).toISOString() : null;
  }
  return out;
}

export async function runScheduled(force = false): Promise<boolean> {
  if (g.dqRunning) return false;
  g.dqRunning = true;
  try {
    const last = await queryOne<{ value: string }>(
      "SELECT value FROM dq_state WHERE name = 'scheduled_at'",
    );
    if (!force && last && Date.now() - Date.parse(last.value) < HOUR) return false;
    await database().execute(
      "INSERT INTO dq_state (name, value) VALUES ('scheduled_at', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
      [new Date().toISOString()],
    );
    // Links in emails need the address; without PUBLIC_URL or DOMAIN they point at localhost.
    const base = configuredPublicUrl() ?? 'http://localhost';
    for (const id of PLUGIN_IDS) {
      const plugin = await loadPlugin(id);
      const hooks = plugin.platform ? await plugin.platform() : null;
      if (!hooks?.scheduled) continue;
      try {
        await hooks.scheduled({
          pluginId: id,
          db: database(id),
          baseUrl: appOrigin(id, base, APP.multi, domainSetting()),
          now: new Date(),
          mail: pluginMailer,
          lastActiveAt,
        });
      } catch (err) {
        console.error(`[instance] Scheduled work of ${id} failed:`, err);
      }
    }
    return true;
  } catch (err) {
    console.error('[instance] Scheduled work failed:', err);
    return false;
  } finally {
    g.dqRunning = false;
  }
}

export function startScheduler(): void {
  if (g.dqTimer) return;
  // Checked every 5 minutes; runs when the last run is an hour old.
  g.dqTimer = setInterval(() => void runScheduled(), 5 * 60_000);
  g.dqTimer.unref?.();
  setTimeout(() => void runScheduled(), 30_000).unref?.();
}
