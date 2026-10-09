import { describe, expect, it } from 'vitest';
import {
  checkEvent,
  checkEventTypes,
  isPrivateChannel,
  parseChannels,
  type EventType,
} from './envelope';

const types = new Map<string, EventType>([
  [
    'order.created',
    {
      name: 'order.created',
      fields: [
        { key: 'orderId', type: 'string', required: true },
        { key: 'total', type: 'number', required: false },
        { key: 'paid', type: 'boolean', required: false },
      ],
    },
  ],
]);
const opts = { types, strict: false, payloadBytes: 2048 };

describe('the event format', () => {
  it('accepts the fixed frame with flat key:value data', () => {
    const r = checkEvent(
      {
        channel: 'orders',
        event: 'order.created',
        data: { orderId: 'A-17', total: 42.5, paid: true },
      },
      opts,
    );
    expect(r.ok && r.event.json).toBe('{"orderId":"A-17","total":42.5,"paid":true}');
    expect(checkEvent({ channel: 'demo', event: 'hello' }, opts).ok).toBe(true);
  });

  it('refuses bad channels, events, keys and values', () => {
    const code = (body: unknown) => {
      const r = checkEvent(body, opts);
      return r.ok ? 'ok' : r.problem.code;
    };
    expect(code(null)).toBe('invalid_json');
    expect(code({ channel: 'a b', event: 'x' })).toBe('invalid_channel');
    expect(code({ channel: 'a', event: '.x' })).toBe('invalid_event');
    expect(code({ channel: 'a', event: 'x', data: [1] })).toBe('invalid_data');
    expect(code({ channel: 'a', event: 'x', data: { '1a': 1 } })).toBe('invalid_data_key');
    expect(code({ channel: 'a', event: 'x', data: { a: { nested: true } } })).toBe('invalid_value');
    expect(code({ channel: 'a', event: 'x', data: { a: 'x'.repeat(501) } })).toBe('invalid_value');
    expect(code({ channel: 'a', event: 'x', data: { a: Infinity } })).toBe('invalid_value');
    const many = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`k${i}`, i]));
    expect(code({ channel: 'a', event: 'x', data: many })).toBe('too_many_keys');
  });

  it('checks described events against the member’s structure', () => {
    const r = (data: unknown, strict = false) => {
      const c = checkEvent({ channel: 'o', event: 'order.created', data }, { ...opts, strict });
      return c.ok ? 'ok' : c.problem;
    };
    expect(r({ total: 1 })).toEqual({ code: 'missing_key', key: 'orderId' });
    expect(r({ orderId: 'A', total: '1' })).toEqual({
      code: 'wrong_type',
      key: 'total',
      expected: 'number',
    });
    expect(r({ orderId: 'A', extra: 1 })).toBe('ok');
    expect(r({ orderId: 'A', extra: 1 }, true)).toEqual({ code: 'unknown_key', key: 'extra' });
    const other = checkEvent({ channel: 'o', event: 'other' }, { ...opts, strict: true });
    expect(!other.ok && other.problem.code).toBe('unknown_event');
  });

  it('keeps events within the plan’s size', () => {
    const r = checkEvent(
      { channel: 'a', event: 'x', data: { a: 'x'.repeat(500) } },
      { ...opts, payloadBytes: 512 },
    );
    expect(r.ok).toBe(true);
    const big = checkEvent(
      { channel: 'a', event: 'x', data: { a: 'x'.repeat(500), b: 'y'.repeat(50) } },
      { ...opts, payloadBytes: 512 },
    );
    expect(!big.ok && big.problem).toEqual({ code: 'payload_too_large', max: 512 });
  });
});

describe('channels and event types', () => {
  it('parses channel lists within the limit', () => {
    expect(parseChannels('demo, private-x,demo', 3)).toEqual(['demo', 'private-x']);
    expect(parseChannels('a,b,c,d', 3)).toBeNull();
    expect(parseChannels('bad channel', 3)).toBeNull();
    expect(parseChannels('', 3)).toBeNull();
    expect(isPrivateChannel('private-x')).toBe(true);
    expect(isPrivateChannel('public')).toBe(false);
  });

  it('checks the structures members save', () => {
    const ok = checkEventTypes(
      [{ name: ' a.b ', fields: [{ key: 'x', type: 'number', required: 1 }] }],
      3,
    );
    expect(ok).toEqual({
      ok: true,
      types: [{ name: 'a.b', fields: [{ key: 'x', type: 'number', required: false }] }],
    });
    expect(
      checkEventTypes(
        [
          { name: 'a', fields: [] },
          { name: 'a', fields: [] },
        ],
        3,
      ),
    ).toEqual({ ok: false, index: 1, reason: 'name' });
    expect(checkEventTypes([{ name: 'a', fields: [{ key: 'x', type: 'date' }] }], 3)).toEqual({
      ok: false,
      index: 0,
      reason: 'fields',
    });
    expect(
      checkEventTypes(
        [
          { name: 'a', fields: [] },
          { name: 'b', fields: [] },
        ],
        1,
      ),
    ).toEqual({ ok: false, index: 1, reason: 'count' });
  });
});
