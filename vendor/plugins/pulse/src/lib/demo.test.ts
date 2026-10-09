import { describe, expect, it } from 'vitest';
import { checkEvent } from './envelope';
import {
  STAMP_FROM,
  STAMP_SENT_AT,
  clockOffset,
  demoChannel,
  demoEvent,
  demoMember,
  demoSender,
  newBrowserName,
  parseDemoJson,
  summarize,
  timing,
  BROWSER_PATTERN,
} from './demo';

describe('demo', () => {
  it('gives each member a private channel and each browser a name', () => {
    expect(demoChannel(12)).toBe('private-demo-u12');
    expect(newBrowserName()).toMatch(BROWSER_PATTERN);
    expect(demoSender(12, 'K7Q2')).toBe('u12.K7Q2');
    expect(demoMember('u12.K7Q2')).toBe('12');
    expect(demoMember('someone')).toBeNull();
  });

  it('accepts flat JSON and explains what is refused', () => {
    expect(parseDemoJson('{"score": 3, "ok": true, "note": null}')).toEqual({
      ok: true,
      data: { score: 3, ok: true, note: null },
    });
    expect(parseDemoJson('{oops')).toMatchObject({ problem: { code: 'notJson' } });
    expect(parseDemoJson('[1]')).toMatchObject({ problem: { code: 'notObject' } });
    expect(parseDemoJson('{}')).toMatchObject({ problem: { code: 'empty' } });
    expect(parseDemoJson('{"a": {"b": 1}}')).toMatchObject({
      problem: { code: 'nested', key: 'a' },
    });
    expect(parseDemoJson('{"a": [1]}')).toMatchObject({ problem: { code: 'nested', key: 'a' } });
    expect(parseDemoJson('{"1x": 1}')).toMatchObject({ problem: { code: 'badKey' } });
    expect(parseDemoJson(`{"${STAMP_FROM}": "x"}`)).toMatchObject({
      problem: { code: 'reservedKey' },
    });
  });

  it('builds an event the real API accepts, with the fixed frame and stamps', () => {
    const event = demoEvent({
      channel: 'private-demo-u12',
      mode: 'json',
      data: { score: 3 },
      browser: 'K7Q2',
      sentAt: 1000.4,
    });
    expect(event).toEqual({
      channel: 'private-demo-u12',
      event: 'demo.json',
      data: { score: 3, [STAMP_FROM]: 'K7Q2', [STAMP_SENT_AT]: 1000 },
    });
    const checked = checkEvent(event, { types: new Map(), strict: false, payloadBytes: 2048 });
    expect(checked.ok).toBe(true);
  });

  it('measures on the server’s clock', () => {
    expect(clockOffset(1000, 1100, 5050)).toBe(4000);
    expect(timing(1000, 1040, 1065)).toEqual({ toServer: 40, toHere: 25, total: 65 });
    expect(timing(null, 1040, 1030)).toEqual({ toServer: null, toHere: 0, total: null });
    expect(summarize([10, 30, 20])).toEqual({ count: 3, average: 20, min: 10, max: 30 });
    expect(summarize([])).toEqual({ count: 0, average: null, min: null, max: null });
  });
});

describe('demo token', () => {
  it('is a normal client token for the member’s own channel only', async () => {
    const { deriveSecret, signClientToken, verifyClientToken } = await import('./keys');
    const { mayListen, mayPublish } = await import('./gateway');
    const secret = deriveSecret(Buffer.alloc(32, 7), 1, 'pk_demo', 'salt');
    const now = 1_800_000_000;
    const token = signClientToken(
      {
        app: 'pk_demo',
        ch: [demoChannel(12)],
        pub: true,
        sub: demoSender(12, 'K7Q2'),
        iat: now,
        exp: now + 600,
      },
      secret,
    );
    const check = verifyClientToken(token, [secret], now + 10);
    expect(check.ok).toBe(true);
    if (!check.ok) return;
    const caller = {
      source: 'token',
      tokenChannels: new Set(check.claims.ch),
      tokenPublish: check.claims.pub === true,
    } as unknown as Parameters<typeof mayListen>[0];
    expect(mayListen(caller, demoChannel(12))).toBe(true);
    expect(mayListen(caller, demoChannel(13))).toBe(false);
    expect(mayPublish(caller, demoChannel(13))).not.toBe('ok');
    expect(verifyClientToken(token, [secret], now + 700).ok).toBe(false);
  });
});
