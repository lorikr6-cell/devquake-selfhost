// Phone notifications for the waiters' app (ADR 0083): Google's FCM (HTTP v1, a service
// account's RS256 token) and Apple's APNs (HTTP/2, an ES256 token from the team's .p8 key).
// node:crypto and node:http2 only, no SDKs or threads. Nothing is sent when the keys are not
// set. The message carries no text: the app writes it in the waiter's language (Android from
// the data, iPhone from loc-key).

import { sign } from 'node:crypto';
import { connect } from 'node:http2';

export type Outcome = 'ok' | 'gone' | 'failed';

/** What a phone is told about a guest's call. */
export interface PhoneCall {
  callId: number;
  tableId: number;
  tableName: string;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');
/** A key from an env var: PEM with real or escaped ("\n") line breaks. */
const pem = (raw: string | undefined) => raw?.trim().replace(/\\n/g, '\n') || null;

/** A signed JWT: RS256 (RSA PKCS#1 v1.5) or ES256 (P-256, r‖s as JOSE wants it). */
export function signJwt(
  header: { alg: 'RS256' | 'ES256' } & Record<string, string>,
  claims: Record<string, string | number>,
  privateKey: string,
): string {
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const signature =
    header.alg === 'ES256'
      ? sign('sha256', Buffer.from(data), { key: privateKey, dsaEncoding: 'ieee-p1363' })
      : sign('sha256', Buffer.from(data), privateKey);
  return `${data}.${b64url(signature)}`;
}

// --- FCM (Android) ---------------------------------------------------------------------------

export interface FcmConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/** FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY (from the Firebase service account). */
export function fcmConfig(env: Record<string, string | undefined> = process.env): FcmConfig | null {
  const projectId = env.FCM_PROJECT_ID?.trim();
  const clientEmail = env.FCM_CLIENT_EMAIL?.trim();
  const privateKey = pem(env.FCM_PRIVATE_KEY);
  return projectId && clientEmail && privateKey ? { projectId, clientEmail, privateKey } : null;
}

/** A data-only, high-priority message: it wakes the app, which shows the notification. */
export function fcmMessage(token: string, call: PhoneCall) {
  return {
    message: {
      token,
      data: {
        kind: 'call',
        callId: String(call.callId),
        tableId: String(call.tableId),
        tableName: call.tableName,
      },
      android: { priority: 'HIGH', ttl: '600s', collapse_key: `call-${call.tableId}` },
    },
  };
}

let fcmAccess: { token: string; until: number } | null = null;

async function fcmToken(cfg: FcmConfig): Promise<string | null> {
  if (fcmAccess && fcmAccess.until > Date.now() + 60_000) return fcmAccess.token;
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: cfg.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    cfg.privateKey,
  );
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) return null;
  const d = (await r.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) return null;
  fcmAccess = { token: d.access_token, until: Date.now() + (d.expires_in ?? 3600) * 1000 };
  return d.access_token;
}

async function sendFcm(cfg: FcmConfig, tokens: string[], call: PhoneCall) {
  const access = await fcmToken(cfg);
  const out = new Map<string, Outcome>();
  if (!access) return out;
  await Promise.all(
    tokens.map(async (token) => {
      try {
        const r = await fetch(
          `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/messages:send`,
          {
            method: 'POST',
            headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
            body: JSON.stringify(fcmMessage(token, call)),
            signal: AbortSignal.timeout(10_000),
          },
        );
        // 404: the app was uninstalled or the token replaced.
        out.set(token, r.ok ? 'ok' : r.status === 404 ? 'gone' : 'failed');
      } catch {
        out.set(token, 'failed');
      }
    }),
  );
  return out;
}

// --- APNs (iPhone) ---------------------------------------------------------------------------

export interface ApnsConfig {
  teamId: string;
  keyId: string;
  privateKey: string;
  topic: string;
  sandbox: boolean;
}

/** APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY (.p8), VENUE_APNS_TOPIC, APNS_SANDBOX=1. */
export function apnsConfig(
  env: Record<string, string | undefined> = process.env,
): ApnsConfig | null {
  const teamId = env.APNS_TEAM_ID?.trim();
  const keyId = env.APNS_KEY_ID?.trim();
  const privateKey = pem(env.APNS_PRIVATE_KEY);
  if (!teamId || !keyId || !privateKey) return null;
  return {
    teamId,
    keyId,
    privateKey,
    topic: env.VENUE_APNS_TOPIC?.trim() || 'com.devquake.venue',
    sandbox: env.APNS_SANDBOX === '1',
  };
}

/** The alert in the phone's own language (Localizable.strings: call_push_title/body). */
export function apnsPayload(call: PhoneCall) {
  return {
    aps: {
      alert: {
        'title-loc-key': 'call_push_title',
        'title-loc-args': [call.tableName],
        'loc-key': 'call_push_body',
      },
      sound: 'default',
      'thread-id': `call-${call.tableId}`,
    },
    callId: call.callId,
    tableId: call.tableId,
  };
}

let apnsJwt: { token: string; until: number } | null = null;

function apnsToken(cfg: ApnsConfig): string {
  // Apple wants a new token at most every 20 minutes and accepts one for an hour.
  if (apnsJwt && apnsJwt.until > Date.now()) return apnsJwt.token;
  const token = signJwt(
    { alg: 'ES256', kid: cfg.keyId },
    { iss: cfg.teamId, iat: Math.floor(Date.now() / 1000) },
    cfg.privateKey,
  );
  apnsJwt = { token, until: Date.now() + 40 * 60_000 };
  return token;
}

async function sendApns(cfg: ApnsConfig, tokens: string[], call: PhoneCall) {
  const out = new Map<string, Outcome>();
  const session = connect(
    cfg.sandbox ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com',
  );
  session.on('error', () => undefined);
  const body = JSON.stringify(apnsPayload(call));
  try {
    const jwt = apnsToken(cfg);
    await Promise.all(
      tokens.map(
        (token) =>
          new Promise<void>((resolve) => {
            const req = session.request({
              ':method': 'POST',
              ':path': `/3/device/${encodeURIComponent(token)}`,
              authorization: `bearer ${jwt}`,
              'apns-topic': cfg.topic,
              'apns-push-type': 'alert',
              'apns-priority': '10',
              'apns-expiration': String(Math.floor(Date.now() / 1000) + 600),
              'apns-collapse-id': `call-${call.tableId}`,
              'content-type': 'application/json',
            });
            let status = 0;
            let reply = '';
            const done = (o: Outcome) => {
              if (!out.has(token)) out.set(token, o);
              resolve();
            };
            req.setTimeout(10_000, () => {
              req.close();
              done('failed');
            });
            req.on('response', (h) => (status = Number(h[':status'])));
            req.on('data', (c: Buffer) => (reply += c.toString()));
            req.on('end', () =>
              done(
                status === 200
                  ? 'ok'
                  : status === 410 || reply.includes('BadDeviceToken')
                    ? 'gone'
                    : 'failed',
              ),
            );
            req.on('error', () => done('failed'));
            req.end(body);
          }),
      ),
    );
  } finally {
    session.close();
  }
  return out;
}

/**
 * Sends a call to phones ({ platform, token }); returns the tokens Google or Apple say are gone.
 * Platforms whose keys are not set are skipped.
 */
export async function sendToPhones(
  phones: { platform: 'fcm' | 'apns'; token: string }[],
  call: PhoneCall,
  env: Record<string, string | undefined> = process.env,
): Promise<string[]> {
  const fcm = fcmConfig(env);
  const apns = apnsConfig(env);
  const of = (p: 'fcm' | 'apns') => phones.filter((x) => x.platform === p).map((x) => x.token);
  const results = await Promise.all([
    fcm && of('fcm').length ? sendFcm(fcm, of('fcm'), call) : new Map<string, Outcome>(),
    apns && of('apns').length ? sendApns(apns, of('apns'), call) : new Map<string, Outcome>(),
  ]);
  return results.flatMap((m) => [...m].filter(([, o]) => o === 'gone').map(([t]) => t));
}
