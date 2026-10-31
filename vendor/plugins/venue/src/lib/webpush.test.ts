import {
  createDecipheriv,
  createECDH,
  createPublicKey,
  hkdfSync,
  randomBytes,
  verify,
} from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { encryptForBrowser, newVapidKeys, vapidAuthorization } from './webpush';

describe('Web Push', () => {
  it('encrypts a message the browser can read (RFC 8291)', () => {
    // The browser's side: its key pair and auth secret, as in a PushSubscription.
    const ua = createECDH('prime256v1');
    ua.generateKeys();
    const auth = randomBytes(16);
    const message = Buffer.from(JSON.stringify({ title: 'Table 4', body: 'is calling' }));
    const sealed = encryptForBrowser(
      message,
      ua.getPublicKey('base64url'),
      auth.toString('base64url'),
    );

    // Decrypt as a browser would.
    const salt = sealed.subarray(0, 16);
    expect(sealed.readUInt32BE(16)).toBe(4096);
    const idLen = sealed[20]!;
    const asPublic = sealed.subarray(21, 21 + idLen);
    const body = sealed.subarray(21 + idLen);
    const shared = ua.computeSecret(asPublic);
    const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPublic]);
    const ikm = Buffer.from(hkdfSync('sha256', shared, auth, keyInfo, 32));
    const cek = Buffer.from(
      hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16),
    );
    const nonce = Buffer.from(
      hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12),
    );
    const decipher = createDecipheriv('aes-128-gcm', cek, nonce);
    decipher.setAuthTag(body.subarray(body.length - 16));
    const plain = Buffer.concat([
      decipher.update(body.subarray(0, body.length - 16)),
      decipher.final(),
    ]);
    expect(plain[plain.length - 1]).toBe(2);
    expect(JSON.parse(plain.subarray(0, -1).toString())).toEqual({
      title: 'Table 4',
      body: 'is calling',
    });
  });

  it('signs the request with the app’s VAPID key (RFC 8292)', () => {
    const keys = newVapidKeys();
    expect(Buffer.from(keys.publicKey, 'base64url')).toHaveLength(65);
    const header = vapidAuthorization(
      keys,
      'https://fcm.googleapis.com/fcm/send/abc',
      'mailto:x@y.z',
      0,
    );
    const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header);
    expect(m).not.toBeNull();
    const [, h, c, s, k] = m!;
    expect(k).toBe(keys.publicKey);
    expect(JSON.parse(Buffer.from(c!, 'base64url').toString())).toMatchObject({
      aud: 'https://fcm.googleapis.com',
      sub: 'mailto:x@y.z',
    });
    const pub = Buffer.from(keys.publicKey, 'base64url');
    const key = createPublicKey({
      key: {
        kty: 'EC',
        crv: 'P-256',
        x: pub.subarray(1, 33).toString('base64url'),
        y: pub.subarray(33).toString('base64url'),
      },
      format: 'jwk',
    });
    const ok = verify(
      'sha256',
      Buffer.from(`${h}.${c}`),
      { key, dsaEncoding: 'ieee-p1363' },
      Buffer.from(s!, 'base64url'),
    );
    expect(ok).toBe(true);
  });
});
