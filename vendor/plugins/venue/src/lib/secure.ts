// Staff PINs and tablet tokens (ADR 0080): a PIN is kept only as scrypt with its own salt; a
// tablet's token is random and kept only as its SHA-256. Compared in constant time. Pure.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** The tablet cookie (HttpOnly, Secure, SameSite=Strict, set by the API). */
export const TABLET_COOKIE = 'venue_tablet';

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${scryptSync(pin, salt, 32).toString('hex')}`;
}

export function pinMatches(pin: string, stored: string | null): boolean {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(pin, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const newTabletToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
