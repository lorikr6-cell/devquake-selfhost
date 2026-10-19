import type { PluginDatabase } from '@devquake/plugin-sdk';
import { platformApp, type AppRow } from './data';
import { deriveSecret, sameText, secretHint } from './keys';
import { maxStreamsPerProcess, platformReservedStreams } from './limits';

// DevQuake's platform service (ADR 0063), as admins see it on /platform. The website signs its
// members' client tokens and publishes "changed" events with the secret key it reads from
// PULSE_PLATFORM_SECRET; this tells the admin whether that key is the service's current one.

/** How the website's PULSE_PLATFORM_SECRET relates to the service's keys. */
export type WebsiteKey = 'current' | 'previous' | 'other' | 'missing';

export function websiteKeyStatus(
  app: Pick<AppRow, 'id' | 'public_key' | 'secret_salt' | 'prev_secret_salt' | 'prev_secret_until'>,
  master: Buffer,
  configured: string | undefined,
  now = Date.now(),
): WebsiteKey {
  if (!configured) return 'missing';
  if (sameText(configured, deriveSecret(master, app.id, app.public_key, app.secret_salt))) {
    return 'current';
  }
  const graceUntil = app.prev_secret_until ? new Date(app.prev_secret_until).getTime() : 0;
  if (
    app.prev_secret_salt &&
    graceUntil > now &&
    sameText(configured, deriveSecret(master, app.id, app.public_key, app.prev_secret_salt))
  ) {
    return 'previous';
  }
  return 'other';
}

export interface PlatformInfo {
  publicKey: string;
  secretHint: string;
  createdAt: string;
  secretRotatedAt: string;
  eventsToday: number;
  openStreams: number;
  reservedStreams: number;
  maxStreams: number;
  websiteKey: WebsiteKey;
}

/** The platform service and its use; made on first call. */
export async function platformInfo(db: PluginDatabase, master: Buffer): Promise<PlatformInfo> {
  const app = await platformApp(db, master);
  const [today] = await db.query<{ events: number | string | null }>(
    'SELECT events FROM usage_daily WHERE app_id = ? AND day = UTC_DATE()',
    [app.id],
  );
  const [open] = await db.query<{ n: number | string }>(
    'SELECT COUNT(*) AS n FROM streams WHERE app_id = ? AND seen_at > UTC_TIMESTAMP() - INTERVAL 90 SECOND',
    [app.id],
  );
  const max = maxStreamsPerProcess();
  return {
    publicKey: app.public_key,
    secretHint: secretHint(deriveSecret(master, app.id, app.public_key, app.secret_salt)),
    createdAt: new Date(app.created_at).toISOString(),
    secretRotatedAt: new Date(app.secret_rotated_at).toISOString(),
    eventsToday: Number(today?.events ?? 0),
    openStreams: Number(open?.n ?? 0),
    reservedStreams: platformReservedStreams(max),
    maxStreams: max,
    websiteKey: websiteKeyStatus(app, master, process.env.PULSE_PLATFORM_SECRET),
  };
}
