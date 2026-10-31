import {
  createECDH,
  createCipheriv,
  createPrivateKey,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  sign,
} from 'node:crypto';

// Browser push notifications (Web Push) without a library: the message is encrypted for the
// browser (RFC 8291, aes128gcm) and the request is signed with the app's own VAPID key pair
// (RFC 8292). Only Node's crypto; one HTTPS request per device. Pure parts are tested.

const b64u = (b: Buffer | Uint8Array) => Buffer.from(b).toString('base64url');
const fromB64u = (s: string) => Buffer.from(s, 'base64url');

export interface VapidKeys {
  /** The public key, uncompressed point (65 bytes), base64url: what the browser subscribes with. */
  publicKey: string;
  /** The private scalar d, base64url. */
  privateKey: string;
}

/** A new VAPID key pair (P-256). */
export function newVapidKeys(): VapidKeys {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = privateKey.export({ format: 'jwk' }) as { d: string; x: string; y: string };
  const pub = Buffer.concat([Buffer.from([4]), fromB64u(jwk.x), fromB64u(jwk.y)]);
  return { publicKey: b64u(pub), privateKey: jwk.d };
}

/** The VAPID Authorization header for a push service's origin (ES256 JWT, 12 hours). */
export function vapidAuthorization(
  keys: VapidKeys,
  endpoint: string,
  subject: string,
  now = Date.now(),
) {
  const pub = fromB64u(keys.publicKey);
  const key = createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      d: keys.privateKey,
      x: b64u(pub.subarray(1, 33)),
      y: b64u(pub.subarray(33, 65)),
    },
    format: 'jwk',
  });
  const header = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64u(
    Buffer.from(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(now / 1000) + 12 * 3600,
        sub: subject,
      }),
    ),
  );
  const signature = sign('sha256', Buffer.from(`${header}.${claims}`), {
    key,
    dsaEncoding: 'ieee-p1363',
  });
  return `vapid t=${header}.${claims}.${b64u(signature)}, k=${keys.publicKey}`;
}

/**
 * The message encrypted for one browser (RFC 8291 aes128gcm, a single record): `p256dh` and
 * `auth` come from the browser's PushSubscription. `salt` and `serverKeys` are for tests.
 */
export function encryptForBrowser(
  payload: Buffer,
  p256dh: string,
  auth: string,
  test?: { salt: Buffer; serverPrivate: Buffer },
): Buffer {
  const uaPublic = fromB64u(p256dh);
  const authSecret = fromB64u(auth);
  const ecdh = createECDH('prime256v1');
  if (test) ecdh.setPrivateKey(test.serverPrivate);
  else ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(uaPublic);
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]);
  const ikm = Buffer.from(hkdfSync('sha256', shared, authSecret, keyInfo, 32));
  const salt = test?.salt ?? randomBytes(16);
  const cek = Buffer.from(
    hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16),
  );
  const nonce = Buffer.from(
    hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12),
  );
  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  // The last (and only) record ends with the padding delimiter 0x02.
  const body = Buffer.concat([
    cipher.update(Buffer.concat([payload, Buffer.from([2])])),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, body]);
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Sends one notification to one browser. Returns 'gone' when the browser dropped the
 * subscription (404/410: delete it), 'ok', or 'failed'.
 */
export async function sendPush(
  keys: VapidKeys,
  target: PushTarget,
  message: Record<string, unknown>,
  subject = 'mailto:contact@devquake.com',
): Promise<'ok' | 'gone' | 'failed'> {
  try {
    const url = new URL(target.endpoint);
    if (url.protocol !== 'https:') return 'gone';
    const body = encryptForBrowser(
      Buffer.from(JSON.stringify(message)),
      target.p256dh,
      target.auth,
    );
    const res = await fetch(target.endpoint, {
      method: 'POST',
      headers: {
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: '300',
        Urgency: 'high',
        Authorization: vapidAuthorization(keys, target.endpoint, subject),
      },
      body: new Uint8Array(body),
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404 || res.status === 410) return 'gone';
    return res.ok ? 'ok' : 'failed';
  } catch {
    return 'failed';
  }
}
