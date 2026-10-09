import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  PUBLIC_KEY_PATTERN,
  deriveSecret,
  ipHash,
  masterKey,
  newPublicKey,
  newSalt,
  publicKeyOfSecret,
  randomId,
  signClientToken,
  verifyClientToken,
} from './keys';

const master = randomBytes(32);

describe('keys', () => {
  it('makes public keys and random ids from an unambiguous alphabet', () => {
    const pk = newPublicKey();
    expect(pk).toMatch(PUBLIC_KEY_PATTERN);
    expect(randomId(40)).toMatch(/^[A-HJ-NP-Za-km-z2-9]{40}$/);
    expect(newPublicKey()).not.toBe(pk);
  });

  it('derives the secret again from the salt; another salt or app gives another secret', () => {
    const pk = newPublicKey();
    const salt = newSalt();
    const secret = deriveSecret(master, 7, pk, salt);
    expect(secret).toBe(deriveSecret(master, 7, pk, salt));
    expect(secret).not.toBe(deriveSecret(master, 7, pk, newSalt()));
    expect(secret).not.toBe(deriveSecret(master, 8, pk, salt));
    expect(secret).not.toBe(deriveSecret(randomBytes(32), 7, pk, salt));
    expect(publicKeyOfSecret(secret)).toBe(pk);
    expect(publicKeyOfSecret('sk_nope')).toBeNull();
  });

  it('reads the master key only when it is 32 bytes of base64', () => {
    expect(masterKey(master.toString('base64'))?.equals(master)).toBe(true);
    expect(masterKey(randomBytes(16).toString('base64'))).toBeNull();
    expect(masterKey(undefined)).toBeNull();
  });

  it('hashes IP addresses with the master key', () => {
    expect(ipHash(master, '1.2.3.4')).toMatch(/^[0-9a-f]{16}$/);
    expect(ipHash(master, '1.2.3.4')).not.toBe(ipHash(randomBytes(32), '1.2.3.4'));
  });
});

describe('client tokens', () => {
  const pk = newPublicKey();
  const secret = deriveSecret(master, 1, pk, newSalt());
  const now = 1_800_000_000;

  it('accepts a token signed with the current or previous secret', () => {
    const token = signClientToken(
      { app: pk, ch: ['private-a'], pub: true, sub: 'u1', iat: now, exp: now + 600 },
      secret,
    );
    const check = verifyClientToken(token, ['sk_other', secret], now);
    expect(check.ok && check.claims.ch).toEqual(['private-a']);
    expect(check.ok && check.claims.sub).toBe('u1');
  });

  it('refuses a wrong signature, a changed claim, expiry and too long a lifetime', () => {
    const token = signClientToken({ app: pk, ch: ['a'], iat: now, exp: now + 600 }, secret);
    expect(verifyClientToken(token, ['sk_wrong'], now)).toEqual({ ok: false, reason: 'bad' });
    const [h, , s] = token.split('.');
    const forged = `${h}.${Buffer.from(JSON.stringify({ app: pk, ch: ['private-x'], iat: now, exp: now + 600 })).toString('base64url')}.${s}`;
    expect(verifyClientToken(forged, [secret], now)).toEqual({ ok: false, reason: 'bad' });
    expect(verifyClientToken(token, [secret], now + 601)).toEqual({ ok: false, reason: 'expired' });
    const long = signClientToken({ app: pk, ch: ['a'], iat: now, exp: now + 86_400 }, secret);
    expect(verifyClientToken(long, [secret], now)).toEqual({ ok: false, reason: 'bad' });
    expect(verifyClientToken('not.a.token', [secret], now)).toEqual({ ok: false, reason: 'bad' });
  });

  it('refuses tokens that are not HS256', () => {
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${b64({ alg: 'none' })}.${b64({ app: pk, ch: ['a'], exp: now + 60 })}.`;
    expect(verifyClientToken(none, [secret], now).ok).toBe(false);
  });
});
