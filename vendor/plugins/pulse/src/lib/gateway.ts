import type { PluginContext, PluginDatabase } from '@devquake/plugin-sdk';
import { logSecurity, type AppRow } from './data';
import { isPrivateChannel, type EventSource, type EventType } from './envelope';
import {
  PUBLIC_KEY_PATTERN,
  deriveSecret,
  ipHash,
  masterKey,
  peekClientToken,
  publicKeyOfSecret,
  sameText,
  verifyClientToken,
} from './keys';
import { LIMITS, planOf, type Limits, type Plan } from './limits';
import { isLocalOrigin } from './origins';
import { Once, WindowCounter } from './rate';

// Who is calling the public API, and what they may do (ADR 0023). Server only.
//
// Three ways in:
// - secret key (Authorization: Bearer sk_…): the member's own server. Refused when it comes from
//   a web page (an Origin header): a secret in a browser is a leaked secret. Optionally only
//   from listed IP addresses; the addresses it is used from are counted (as hashes) so the
//   member sees when the key is being shared.
// - client token (Authorization: Bearer <JWT>, or ?token=): minted by the member's server for
//   one of their users, short-lived, lists the channels, may allow sending.
// - public key (X-Pulse-Key, or ?key=): only from the app's verified websites (browsers set
//   Origin themselves; scripts could fake it, so the public key can only listen to public
//   channels and, if the member allows it, send to them, within the app's limits).
// The member's own live test on pulse.devquake.com (same origin, signed in as the owner) may do
// everything.

type Db = Omit<PluginDatabase, 'transaction'>;

export type ApiCode =
  | 'unauthorized'
  | 'invalid_key'
  | 'invalid_token'
  | 'token_expired'
  | 'origin_not_allowed'
  | 'secret_in_browser'
  | 'ip_not_allowed'
  | 'subscription_required'
  | 'app_paused'
  | 'channel_not_allowed'
  | 'publish_not_allowed'
  | 'rate_limited'
  | 'daily_limit'
  | 'too_many_connections'
  | 'busy'
  | 'too_many_failures'
  | 'unavailable'
  | 'invalid_channels'
  | 'poll_too_soon'
  | 'method_not_allowed'
  | 'body_too_large';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiCode,
    public retryAfterSeconds?: number,
    public extra: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

/** English messages of the public API (developers' code reads `code`; dashboards translate it). */
export const API_MESSAGES: Record<ApiCode, string> = {
  unauthorized: 'Send your public key (X-Pulse-Key), a client token or your secret key.',
  invalid_key: 'This key does not belong to any app.',
  invalid_token: 'This client token is not valid for this app.',
  token_expired: 'This client token has expired. Get a new one from your server.',
  origin_not_allowed: 'This website is not allowed to use the key. Add and verify it in your app.',
  secret_in_browser:
    'Secret keys must never be used in web pages. Use the public key or a client token.',
  ip_not_allowed: 'The secret key may not be used from this IP address.',
  subscription_required: 'The owner of this app is not subscribed to Pulse (or their trial ended).',
  app_paused: 'This app is paused by its owner.',
  channel_not_allowed: 'This caller may not use this channel.',
  publish_not_allowed: 'This caller may not send events.',
  rate_limited: 'Too many events. Slow down.',
  daily_limit: 'This app has reached its events for today.',
  too_many_connections: 'This app has too many live connections open.',
  busy: 'The service is busy. Try again shortly.',
  too_many_failures: 'Too many failed attempts from this address. Try again later.',
  unavailable: 'The service is not available right now.',
  invalid_channels: 'Give one or more valid channel names (comma separated).',
  poll_too_soon: 'Polling too often. Wait before the next poll.',
  method_not_allowed: 'This method is not allowed here.',
  body_too_large: 'The request body is too large.',
};

export interface AppEntry {
  app: AppRow;
  /** Verified websites (lowercase origins). */
  origins: Set<string>;
  types: Map<string, EventType>;
  accountPlan: string | null;
  fetchedAt: number;
}

export interface Caller {
  entry: AppEntry;
  plan: Plan;
  limits: Limits;
  source: EventSource;
  /** Who sent it in the member's app (client token `sub`). */
  sender?: string;
  /** The Origin to allow in the response (browsers). */
  origin: string | null;
  /** Channels a client token may use (null = any, within the rules). */
  tokenChannels: Set<string> | null;
  tokenPublish: boolean;
  ip: string;
}

const APP_TTL_MS = 30_000;
const ACCESS_TTL_MS = 60_000;
const cache = new Map<string, AppEntry>();
const accessCache = new Map<number, { level: 'member' | 'trial' | 'none'; at: number }>();
const failures = new WindowCounter(10 * 60_000, 30);
const loggedOnce = new Once(60_000);
const seenIps = new Once(6 * 60 * 60_000);

/** Forget a cached app after the owner changed it (this server process; others within 30 s). */
export function forgetApp(publicKey: string) {
  cache.delete(publicKey);
}

async function loadApp(db: Db, publicKey: string, now: number): Promise<AppEntry | null> {
  const hit = cache.get(publicKey);
  if (hit && now - hit.fetchedAt < APP_TTL_MS) return hit;
  const [app] = await db.query<AppRow>('SELECT * FROM apps WHERE public_key = ?', [publicKey]);
  if (!app) {
    cache.delete(publicKey);
    return null;
  }
  const [origins, types, account] = await Promise.all([
    db.query<{ origin: string }>(
      'SELECT origin FROM app_origins WHERE app_id = ? AND verified_at IS NOT NULL',
      [app.id],
    ),
    db.query<{ name: string; fields: string }>(
      'SELECT name, fields FROM event_types WHERE app_id = ?',
      [app.id],
    ),
    db.query<{ plan: string }>('SELECT plan FROM accounts WHERE user_id = ?', [app.user_id]),
  ]);
  const entry: AppEntry = {
    app,
    origins: new Set(origins.map((o) => o.origin.toLowerCase())),
    types: new Map(types.map((t) => [t.name, { name: t.name, fields: JSON.parse(t.fields) }])),
    accountPlan: account[0]?.plan ?? null,
    fetchedAt: now,
  };
  cache.set(publicKey, entry);
  if (cache.size > 5000) cache.clear();
  return entry;
}

/** The owner's plan now: from their DevQuake access (cached a minute) and their account row. */
async function planFor(ctx: PluginContext, entry: AppEntry, now: number): Promise<Plan | null> {
  // The demo service belongs to DevQuake: its own fixed plan, shared by every member trying it
  // (each member's sending is limited separately, see /v1/events).
  if (entry.app.demo === 1) return 'full';
  const userId = entry.app.user_id;
  let level: 'member' | 'trial' | 'none' = 'member'; // local development without the platform
  if (ctx.accessOf) {
    const hit = accessCache.get(userId);
    if (hit && now - hit.at < ACCESS_TTL_MS) level = hit.level;
    else {
      level = (await ctx.accessOf([userId]))[userId] ?? 'none';
      accessCache.set(userId, { level, at: now });
      if (accessCache.size > 5000) accessCache.clear();
    }
  }
  return planOf(level, entry.accountPlan);
}

/** The app's secret keys that are valid now (the previous one during its grace period). */
function secretsOf(app: AppRow, master: Buffer, now: number): string[] {
  const list = [deriveSecret(master, app.id, app.public_key, app.secret_salt)];
  if (
    app.prev_secret_salt &&
    app.prev_secret_until &&
    new Date(app.prev_secret_until).getTime() > now
  ) {
    list.push(deriveSecret(master, app.id, app.public_key, app.prev_secret_salt));
  }
  return list;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** Records a refusal for the owner to see (at most once a minute per app and kind). */
async function note(db: Db, appId: number, kind: string, detail: string | null, now: number) {
  if (loggedOnce.pass(`${appId}:${kind}`, now)) {
    await logSecurity(db, appId, kind, detail).catch(() => undefined);
  }
}

function fail(ip: string, now: number, status: number, code: ApiCode): never {
  failures.hit(ip, now);
  throw new ApiError(status, code);
}

/** Is a browser from `origin` allowed for this app (verified website or, if allowed, localhost)? */
function originAllowed(entry: AppEntry, origin: string): boolean {
  const o = origin.toLowerCase();
  return entry.origins.has(o) || (entry.app.allow_localhost === 1 && isLocalOrigin(o));
}

/**
 * Works out who is calling and checks the key, the website, the owner's subscription and the
 * app state. Throws ApiError with the reason. `query` holds key/token from the URL (EventSource
 * cannot send headers).
 */
export async function identify(
  request: Request,
  ctx: PluginContext,
  db: Db,
  query: URLSearchParams,
  now = Date.now(),
): Promise<Caller> {
  const master = masterKey();
  if (!master) throw new ApiError(503, 'unavailable');
  const ip = clientIp(request);
  if (failures.blocked(ip, now)) throw new ApiError(429, 'too_many_failures', 600);
  const origin = request.headers.get('origin');
  const bearer = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1] ?? null;
  const token = bearer && !bearer.startsWith('sk_') ? bearer : query.get('token');
  const secret = bearer?.startsWith('sk_') ? bearer : null;
  const key = request.headers.get('x-pulse-key') ?? query.get('key');

  let entry: AppEntry | null = null;
  let source: EventSource;
  let sender: string | undefined;
  let tokenChannels: Set<string> | null = null;
  let tokenPublish = false;

  if (secret) {
    const pk = publicKeyOfSecret(secret);
    entry = pk ? await loadApp(db, pk, now) : null;
    if (!entry || !secretsOf(entry.app, master, now).some((s) => sameText(s, secret))) {
      if (entry) await note(db, entry.app.id, 'bad_secret', null, now);
      fail(ip, now, 401, 'invalid_key');
    }
    if (origin && origin !== ctx.baseUrl) {
      await note(db, entry.app.id, 'secret_in_browser', origin, now);
      throw new ApiError(403, 'secret_in_browser');
    }
    const allowed = entry.app.server_ips?.split(',').filter(Boolean) ?? [];
    if (allowed.length && !allowed.includes(ip)) {
      await note(db, entry.app.id, 'ip_not_allowed', null, now);
      throw new ApiError(403, 'ip_not_allowed');
    }
    const hash = ipHash(master, ip);
    if (seenIps.pass(`${entry.app.id}:${hash}`, now)) {
      await db
        .execute('INSERT IGNORE INTO server_ips (app_id, day, ip_hash) VALUES (?, UTC_DATE(), ?)', [
          entry.app.id,
          hash,
        ])
        .catch(() => undefined);
    }
    source = 'server';
  } else if (token) {
    const claims = peekClientToken(token);
    entry =
      claims && PUBLIC_KEY_PATTERN.test(claims.app) ? await loadApp(db, claims.app, now) : null;
    if (!entry) fail(ip, now, 401, 'invalid_token');
    const check = verifyClientToken(
      token,
      secretsOf(entry.app, master, now),
      Math.floor(now / 1000),
    );
    if (!check.ok) {
      if (check.reason === 'expired') throw new ApiError(401, 'token_expired');
      await note(db, entry.app.id, 'bad_token', null, now);
      fail(ip, now, 401, 'invalid_token');
    }
    // A token in a web page is only accepted on the member's own websites (native apps send no
    // Origin).
    if (origin && origin !== ctx.baseUrl && !originAllowed(entry, origin)) {
      await note(db, entry.app.id, 'origin_rejected', origin, now);
      throw new ApiError(403, 'origin_not_allowed');
    }
    source = 'token';
    sender = check.claims.sub?.slice(0, 64);
    tokenChannels = new Set(check.claims.ch);
    tokenPublish = check.claims.pub === true;
  } else if (key) {
    entry = PUBLIC_KEY_PATTERN.test(key) ? await loadApp(db, key, now) : null;
    if (!entry) fail(ip, now, 401, 'invalid_key');
    const isConsole = origin === ctx.baseUrl && ctx.user?.id === entry.app.user_id;
    if (isConsole) source = 'console';
    else {
      // Browsers always send Origin on these requests; without it this is not a browser.
      if (!origin || !originAllowed(entry, origin)) {
        await note(db, entry.app.id, 'origin_rejected', origin ?? '(none)', now);
        throw new ApiError(403, 'origin_not_allowed');
      }
      source = 'browser';
    }
  } else {
    throw new ApiError(401, 'unauthorized');
  }

  if (entry.app.paused === 1) throw new ApiError(403, 'app_paused');
  const plan = await planFor(ctx, entry, now);
  if (!plan) throw new ApiError(402, 'subscription_required');
  return {
    entry,
    plan,
    limits: LIMITS[plan],
    source,
    sender,
    origin,
    tokenChannels,
    tokenPublish,
    ip,
  };
}

/** May this caller listen to `channel`? */
export function mayListen(c: Caller, channel: string): boolean {
  if (c.source === 'server' || c.source === 'console') return true;
  if (c.source === 'token') return c.tokenChannels!.has(channel);
  return !isPrivateChannel(channel);
}

/** May this caller send to `channel`? */
export function mayPublish(
  c: Caller,
  channel: string,
): 'ok' | 'channel_not_allowed' | 'publish_not_allowed' {
  if (c.source === 'server' || c.source === 'console') return 'ok';
  if (c.source === 'token') {
    if (!c.tokenPublish) return 'publish_not_allowed';
    return c.tokenChannels!.has(channel) ? 'ok' : 'channel_not_allowed';
  }
  if (c.entry.app.browser_publish !== 1) return 'publish_not_allowed';
  return isPrivateChannel(channel) ? 'channel_not_allowed' : 'ok';
}

// ---- Responses ---------------------------------------------------------------------------------

/**
 * CORS: the response may be read by the page that asked. Nothing here uses cookies across sites
 * (no credentials), and every call is checked above, so echoing the Origin is safe.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  return origin
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Expose-Headers': 'Retry-After',
        Vary: 'Origin',
      }
    : {};
}

export function preflight(request: Request): Response {
  const origin = request.headers.get('origin');
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Pulse-Key, Last-Event-ID',
      'Access-Control-Max-Age': '600',
    },
  });
}

export function apiJson(
  status: number,
  body: unknown,
  origin: string | null,
  extra: HeadersInit = {},
) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...corsHeaders(origin), ...extra },
  });
}

export function apiErrorResponse(err: ApiError, origin: string | null): Response {
  const headers: Record<string, string> = {};
  if (err.retryAfterSeconds) headers['Retry-After'] = String(err.retryAfterSeconds);
  return apiJson(
    err.status,
    { error: { code: err.code, message: API_MESSAGES[err.code], ...err.extra } },
    origin,
    headers,
  );
}

/** Counts a refused event in today's usage (dashboard). */
export async function countRejected(db: Db, appId: number) {
  await db
    .execute(
      `INSERT INTO usage_daily (app_id, day, rejected) VALUES (?, UTC_DATE(), 1)
       ON DUPLICATE KEY UPDATE rejected = rejected + 1`,
      [appId],
    )
    .catch(() => undefined);
}
