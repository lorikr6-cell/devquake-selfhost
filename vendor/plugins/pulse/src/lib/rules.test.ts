import { describe, expect, it } from 'vitest';
import { flush, route, type EventRow, type Listener } from './hub';
import { LIMITS, maxStreamsPerProcess, planOf } from './limits';
import { isLocalOrigin, normaliseOrigin, proofRecordName } from './origins';
import { Buckets, Once, WindowCounter } from './rate';
import { serverIps } from './validate';

describe('plans', () => {
  it('follows the DevQuake access and the account row', () => {
    expect(planOf('none', 'full')).toBeNull();
    expect(planOf('trial', 'full')).toBe('trial');
    expect(planOf('member', null)).toBe('standard');
    expect(planOf('member', 'full')).toBe('full');
  });

  it('gives members the full plan on a self-hosted instance', () => {
    expect(planOf('member', null, 'full')).toBe('full');
    expect(planOf('trial', null, 'full')).toBe('trial');
    expect(planOf('member', null, 'standard')).toBe('standard');
  });

  it('keeps the trial slower and smaller than a subscription', () => {
    const { trial, standard, full } = LIMITS;
    expect(trial.deliveryDelayMs).toBeGreaterThan(0);
    expect(standard.deliveryDelayMs).toBe(0);
    for (const k of [
      'apps',
      'connections',
      'eventsPerDay',
      'eventsPerMinute',
      'payloadBytes',
    ] as const) {
      expect(trial[k]).toBeLessThan(standard[k]);
      expect(standard[k]).toBeLessThan(full[k]);
    }
  });

  it('caps live connections per process', () => {
    expect(maxStreamsPerProcess(undefined)).toBe(30);
    expect(maxStreamsPerProcess('80')).toBe(80);
    expect(maxStreamsPerProcess('-1')).toBe(30);
  });
});

describe('websites', () => {
  it('normalises https origins of real domains; localhost only for development', () => {
    expect(normaliseOrigin('shop.example.com/path?x')).toBe('https://shop.example.com');
    expect(normaliseOrigin('HTTPS://Shop.Example.com:443')).toBe('https://shop.example.com');
    expect(normaliseOrigin('https://shop.example.com:8443')).toBe('https://shop.example.com:8443');
    expect(normaliseOrigin('http://shop.example.com')).toBeNull();
    expect(normaliseOrigin('https://1.2.3.4')).toBeNull();
    expect(normaliseOrigin('https://user:pw@example.com')).toBeNull();
    expect(normaliseOrigin('http://localhost:5173')).toBe('http://localhost:5173');
    expect(isLocalOrigin('http://localhost:5173')).toBe(true);
    expect(isLocalOrigin('https://localhost.example.com')).toBe(false);
    expect(proofRecordName('https://shop.example.com')).toBe('_devquake-pulse.shop.example.com');
  });

  it('accepts server IP lists', () => {
    expect(serverIps('203.0.113.10\n2001:db8::1, 203.0.113.10')).toEqual([
      '203.0.113.10',
      '2001:db8::1',
    ]);
    expect(serverIps('')).toEqual([]);
    expect(() => serverIps('999.1.1.1')).toThrow();
  });
});

describe('rate limits', () => {
  it('allows a burst, then the sustained rate', () => {
    const b = new Buckets();
    const t = 1_000_000;
    expect([1, 2, 3].map(() => b.take('a', 60, 3, t))).toEqual([true, true, true]);
    expect(b.take('a', 60, 3, t)).toBe(false);
    expect(b.waitMs('a', 60)).toBeGreaterThan(0);
    expect(b.take('a', 60, 3, t + 1000)).toBe(true);
  });

  it('counts failures in a window and lets things through once per period', () => {
    const w = new WindowCounter(1000, 2);
    expect([w.hit('ip', 0), w.hit('ip', 1), w.hit('ip', 2)]).toEqual([true, true, false]);
    expect(w.blocked('ip', 3)).toBe(true);
    expect(w.blocked('ip', 2000)).toBe(false);
    const o = new Once(1000);
    expect([o.pass('k', 0), o.pass('k', 500), o.pass('k', 1000)]).toEqual([true, false, true]);
  });
});

describe('delivery', () => {
  const row = (id: number, channel: string, appId = 1, at = new Date(0)): EventRow => ({
    id,
    app_id: appId,
    channel,
    event: 'e',
    data: '{"a":1}',
    source: 'server',
    sender: null,
    created_at: at,
  });
  const listener = (delayMs = 0): Listener & { got: string[] } => {
    const got: string[] = [];
    return {
      id: 'l',
      appId: 1,
      publicKey: 'pk_x',
      channels: new Set(['a']),
      delayMs,
      cursor: 1,
      queue: [],
      send: (e) => got.push(e.id),
      got,
    };
  };

  it('hands each listener only its app, its channels and new events', () => {
    const l = listener();
    route([row(1, 'a'), row(2, 'a'), row(3, 'b'), row(4, 'a', 2)], [l]);
    flush(l, 10_000);
    expect(l.got).toEqual(['2']);
    expect(l.cursor).toBe(2);
  });

  it('holds events back for the trial delay', () => {
    const l = listener(3000);
    route([row(2, 'a', 1, new Date(1000))], [l]);
    flush(l, 2000);
    expect(l.got).toEqual([]);
    flush(l, 4000);
    expect(l.got).toEqual(['2']);
  });
});
