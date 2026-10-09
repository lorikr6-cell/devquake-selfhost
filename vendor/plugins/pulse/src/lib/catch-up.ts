import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { Envelope } from './envelope';
import { toEnvelope, type EventRow } from './hub';

type Db = Omit<PluginDatabase, 'transaction'>;

/**
 * Events of an app after `afterId` on these channels, within the app's history and at least
 * `delayMs` old (trial), oldest first. For polling and for reconnecting live connections.
 */
export async function eventsSince(
  db: Db,
  app: { id: number; publicKey: string },
  channels: string[],
  afterId: number,
  historyMinutes: number,
  delayMs: number,
  limit = 100,
): Promise<Envelope[]> {
  const marks = channels.map(() => '?').join(', ');
  const rows = await db.query<EventRow>(
    `SELECT id, app_id, channel, event, data, source, sender, created_at FROM events
      WHERE app_id = ? AND id > ? AND channel IN (${marks})
        AND created_at > UTC_TIMESTAMP(3) - INTERVAL ? MINUTE
        AND created_at <= UTC_TIMESTAMP(3) - INTERVAL ? MICROSECOND
      ORDER BY id LIMIT ?`,
    [app.id, afterId, ...channels, historyMinutes, delayMs * 1000, limit],
  );
  return rows.map((r) => toEnvelope(r, app.publicKey));
}

/** A Last-Event-ID / ?after= value, or null. */
export function eventId(raw: string | null): number | null {
  if (!raw || !/^\d{1,18}$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}
