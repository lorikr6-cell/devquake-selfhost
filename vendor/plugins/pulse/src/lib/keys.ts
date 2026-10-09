import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Keys of an API service (ADR 0023). Server only.
//
// - Public key  "pk_<24 chars>": identifies the app. Safe in web pages; only works from the
//   app's verified websites (Origin), for listening and, if allowed, sending.
// - Secret key  "sk_<24 chars of the public key>_<43 chars>": for the member's own server. Never
//   stored: HMAC-SHA-256(PULSE_MASTER_KEY, app id + salt), shown once, checked by deriving it
//   again. Rotating it changes the salt; the old one works for a grace period.
// - Client token: a short-lived JWT (HS256, signed with the secret key by the member's server)
//   that lets one browser or phone listen to private channels and, if it says so, send.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** Random text from an unambiguous alphabet (no 0/O, 1/l/I). */
export function randomId(length: number): string {
  const bytes = randomBytes(length * 2);
  let out = '';
  for (let i = 0; out.length < length && i < bytes.length; i++) {
    const b = bytes[i]!;
    // Rejection sampling: no bias towards the first letters.
    if (b < 256 - (256 % ALPHABET.length)) out += ALPHABET[b % ALPHABET.length];
  }
  return out.length === length ? out : randomId(length);
}

export function newPublicKey(): string {
  return `pk_${randomId(24)}`;
}

export function newSalt(): string {
  return randomBytes(16).toString('hex');
}

export const PUBLIC_KEY_PATTERN = /^pk_[A-Za-z0-9]{24}$/;
const SECRET_PATTERN = /^sk_([A-Za-z0-9]{24})_([A-Za-z0-9_-]{43})$/;

/** The master key from PULSE_MASTER_KEY (32 bytes, base64), or null when it is not set. */
export function masterKey(raw: string | undefined = process.env.PULSE_MASTER_KEY): Buffer | null {
  if (!raw) return null;
  try {
    const key = Buffer.from(raw, 'base64');
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

/** The secret key of an app (derived, never stored). */
export function deriveSecret(master: Buffer, appId: number, publicKey: string, salt: string) {
  const mac = createHmac('sha256', master)
    .update(`pulse-secret\u0000${appId}\u0000${salt}`)
    .digest('base64url');
  return `sk_${publicKey.slice(3)}_${mac}`;
}

/** The last four characters, shown so the member recognises which secret is in use. */
export function secretHint(secret: string): string {
  return secret.slice(-4);
}

/** The public key a secret key belongs to, or null when it does not look like one. */
export function publicKeyOfSecret(secret: string): string | null {
  const m = SECRET_PATTERN.exec(secret);
  return m ? `pk_${m[1]}` : null;
}

/** Constant-time string comparison. */
export function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** A keyed, shortened hash of an IP address (privacy: the address itself is never stored). */
export function ipHash(master: Buffer, ip: string): string {
  return createHmac('sha256', master).update(`ip\u0000${ip}`).digest('hex').slice(0, 16);
}

/** The DNS TXT value that proves a website belongs to the member. */
export function originProof(token: string): string {
  return `devquake-pulse=${token}`;
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

// ---- Client tokens (JWT, HS256) -------------------------------------------------------------

export interface ClientToken {
  /** The app's public key. */
  app: string;
  /** Channels the holder may listen to (and send to, with `pub`). */
  ch: string[];
  /** May send events. */
  pub?: boolean;
  /** Optional: who the holder is in the member's own app (shown to listeners as `sender`). */
  sub?: string;
  /** Expiry, seconds since 1970 (at most one hour after `iat`). */
  exp: number;
  iat?: number;
}

/** Longest lifetime of a client token. */
export const TOKEN_MAX_SECONDS = 3600;

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** Signs a client token (what the member's server does; used by tests and the live test). */
export function signClientToken(claims: ClientToken, secret: string): string {
  const head = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}`;
  return `${head}.${createHmac('sha256', secret).update(head).digest('base64url')}`;
}

/** The claims of a token without checking it (to find the app), or null when malformed. */
export function peekClientToken(token: string): ClientToken | null {
  const parts = token.split('.');
  if (parts.length !== 3 || token.length > 4096) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0]!, 'base64url').toString('utf8'));
    if (header?.alg !== 'HS256') return null;
    const claims = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8'));
    if (
      typeof claims?.app !== 'string' ||
      !Array.isArray(claims.ch) ||
      !claims.ch.every((c: unknown) => typeof c === 'string') ||
      typeof claims.exp !== 'number' ||
      (claims.sub !== undefined && typeof claims.sub !== 'string')
    ) {
      return null;
    }
    return claims as ClientToken;
  } catch {
    return null;
  }
}

export type TokenCheck =
  { ok: true; claims: ClientToken } | { ok: false; reason: 'bad' | 'expired' };

/**
 * Checks a client token against the app's secret keys (current, and the previous one during
 * its grace period): signature, expiry, and a lifetime of at most an hour.
 */
export function verifyClientToken(
  token: string,
  secrets: string[],
  nowSeconds: number,
): TokenCheck {
  const claims = peekClientToken(token);
  if (!claims) return { ok: false, reason: 'bad' };
  const [head, body, signature] = token.split('.') as [string, string, string];
  const signed = secrets.some((secret) =>
    sameText(createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url'), signature),
  );
  if (!signed) return { ok: false, reason: 'bad' };
  if (claims.exp <= nowSeconds) return { ok: false, reason: 'expired' };
  const issued = typeof claims.iat === 'number' ? claims.iat : nowSeconds;
  if (claims.exp - Math.min(issued, nowSeconds) > TOKEN_MAX_SECONDS + 60) {
    return { ok: false, reason: 'bad' };
  }
  return { ok: true, claims };
}
