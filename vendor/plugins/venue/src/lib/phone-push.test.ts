import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  apnsConfig,
  apnsPayload,
  fcmConfig,
  fcmMessage,
  sendToPhones,
  signJwt,
} from './phone-push';
import { PAIR_LENGTH, newPairCode, normalizePairCode, pairLink } from './phones';

const call = { callId: 7, tableId: 3, tableName: 'Table 5' };

function parts(jwt: string) {
  const [h, c, s] = jwt.split('.');
  return {
    header: JSON.parse(Buffer.from(h!, 'base64url').toString()),
    claims: JSON.parse(Buffer.from(c!, 'base64url').toString()),
    data: Buffer.from(`${h}.${c}`),
    signature: Buffer.from(s!, 'base64url'),
  };
}

describe('signJwt', () => {
  it('signs RS256 for Google', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const p = parts(signJwt({ alg: 'RS256', typ: 'JWT' }, { iss: 'a@b' }, pem));
    expect(p.header.alg).toBe('RS256');
    expect(p.claims.iss).toBe('a@b');
    expect(verify('sha256', p.data, publicKey, p.signature)).toBe(true);
  });

  it('signs ES256 for Apple, r‖s in 64 bytes', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const p = parts(signJwt({ alg: 'ES256', kid: 'KEY1' }, { iss: 'TEAM' }, pem));
    expect(p.header).toEqual({ alg: 'ES256', kid: 'KEY1' });
    expect(p.signature).toHaveLength(64);
    expect(
      verify('sha256', p.data, { key: publicKey, dsaEncoding: 'ieee-p1363' }, p.signature),
    ).toBe(true);
  });
});

describe('config and messages', () => {
  it('reads keys with escaped line breaks, and nothing without them', () => {
    expect(fcmConfig({})).toBeNull();
    expect(apnsConfig({ APNS_TEAM_ID: 'T' })).toBeNull();
    const fcm = fcmConfig({
      FCM_PROJECT_ID: 'p',
      FCM_CLIENT_EMAIL: 'e',
      FCM_PRIVATE_KEY: 'A\\nB',
    });
    expect(fcm?.privateKey).toBe('A\nB');
    const apns = apnsConfig({ APNS_TEAM_ID: 'T', APNS_KEY_ID: 'K', APNS_PRIVATE_KEY: 'x' });
    expect(apns).toMatchObject({ topic: 'com.devquake.venue', sandbox: false });
  });

  it('sends no text to Google or Apple', () => {
    const m = fcmMessage('tok', call).message;
    expect(m).not.toHaveProperty('notification');
    expect(m.data).toEqual({ kind: 'call', callId: '7', tableId: '3', tableName: 'Table 5' });
    expect(m.android.priority).toBe('HIGH');
    const a = apnsPayload(call).aps.alert;
    expect(a['loc-key']).toBe('call_push_body');
    expect(a['title-loc-args']).toEqual(['Table 5']);
  });

  it('skips platforms without keys', async () => {
    expect(await sendToPhones([{ platform: 'fcm', token: 'x'.repeat(30) }], call, {})).toEqual([]);
  });
});

describe('pairing codes', () => {
  it('makes codes it accepts, typed with dashes or in lower case', () => {
    const code = newPairCode();
    expect(code).toHaveLength(PAIR_LENGTH);
    expect(normalizePairCode(code)).toBe(code);
    expect(normalizePairCode(`${code.slice(0, 5).toLowerCase()}-${code.slice(5)}`)).toBe(code);
  });

  it('refuses codes of the wrong length or with look-alike letters', () => {
    expect(normalizePairCode('ABC')).toBeNull();
    expect(normalizePairCode('ABCDEFGHI0')).toBeNull();
    expect(normalizePairCode(undefined)).toBeNull();
  });

  it('links the app to the server in the QR', () => {
    expect(pairLink('https://venue.devquake.com', 'ABCDEFGHJK')).toBe(
      'devquake-venue://pair?server=https%3A%2F%2Fvenue.devquake.com&code=ABCDEFGHJK',
    );
  });
});
