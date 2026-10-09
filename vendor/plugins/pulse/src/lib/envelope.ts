// The event format (ADR 0023). Pure, shared by the API, the dashboard and tests.
//
// What is sent (fixed structure):
//   { "channel": "orders", "event": "order.created", "data": { ...the member's key:value } }
// What listeners receive (fixed structure, the server adds id, app, source and time):
//   { "id": "812", "app": "pk_…", "channel": "orders", "event": "order.created",
//     "data": { … }, "source": "server", "sender": "user-17", "at": "2026-09-26T10:00:00.000Z" }
//
// `data` is flat: keys → text, number, true/false or null. Members may describe the keys of each
// event (event types); with "strict" on, only described events and keys are accepted.

export const CHANNEL_PATTERN = /^[A-Za-z0-9_\-.:]{1,64}$/;
export const EVENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_\-.:]{0,63}$/;
export const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,39}$/;

/** Channels starting with this need a client token to listen or send (never the public key). */
export const PRIVATE_PREFIX = 'private-';

export const MAX_KEYS = 20;
export const MAX_TEXT = 500;
export const MAX_FIELDS = 20;

export type FieldType = 'string' | 'number' | 'boolean';
export const FIELD_TYPES: readonly FieldType[] = ['string', 'number', 'boolean'];

export interface FieldSpec {
  key: string;
  type: FieldType;
  required: boolean;
}

export interface EventType {
  name: string;
  fields: FieldSpec[];
}

export type DataValue = string | number | boolean | null;
export type EventData = Record<string, DataValue>;

export type EventSource = 'server' | 'browser' | 'token' | 'console';

/** What a listener receives. */
export interface Envelope {
  id: string;
  app: string;
  channel: string;
  event: string;
  data: EventData;
  source: EventSource;
  sender?: string;
  at: string;
}

/** A refused event: a stable code (API) and values for the message. */
export interface Problem {
  code:
    | 'invalid_json'
    | 'invalid_channel'
    | 'invalid_event'
    | 'invalid_data'
    | 'invalid_data_key'
    | 'invalid_value'
    | 'too_many_keys'
    | 'payload_too_large'
    | 'unknown_event'
    | 'unknown_key'
    | 'missing_key'
    | 'wrong_type';
  key?: string;
  expected?: string;
  max?: number;
}

/** Every Problem code (the dashboard has a text for each). */
export const PROBLEM_CODES: readonly Problem['code'][] = [
  'invalid_json',
  'invalid_channel',
  'invalid_event',
  'invalid_data',
  'invalid_data_key',
  'invalid_value',
  'too_many_keys',
  'payload_too_large',
  'unknown_event',
  'unknown_key',
  'missing_key',
  'wrong_type',
];

export function isPrivateChannel(channel: string): boolean {
  return channel.startsWith(PRIVATE_PREFIX);
}

/** Parses "a,b,c" (from a URL) into distinct valid channel names, or null when one is invalid. */
export function parseChannels(raw: string | null, max: number): string[] | null {
  const list = [
    ...new Set(
      (raw ?? '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ];
  if (list.length === 0 || list.length > max) return null;
  return list.every((c) => CHANNEL_PATTERN.test(c)) ? list : null;
}

export interface Incoming {
  channel: string;
  event: string;
  data: EventData;
  /** Bytes of `data` as stored (JSON). */
  json: string;
}

/**
 * Checks one event against the fixed structure, the member's event types and the size limit.
 * `types` by name; with `strict`, events and keys that are not described are refused.
 */
export function checkEvent(
  body: unknown,
  opts: { types: Map<string, EventType>; strict: boolean; payloadBytes: number },
): { ok: true; event: Incoming } | { ok: false; problem: Problem } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, problem: { code: 'invalid_json' } };
  }
  const { channel, event, data = {} } = body as Record<string, unknown>;
  if (typeof channel !== 'string' || !CHANNEL_PATTERN.test(channel)) {
    return { ok: false, problem: { code: 'invalid_channel' } };
  }
  if (typeof event !== 'string' || !EVENT_PATTERN.test(event)) {
    return { ok: false, problem: { code: 'invalid_event' } };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, problem: { code: 'invalid_data' } };
  }
  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length > MAX_KEYS)
    return { ok: false, problem: { code: 'too_many_keys', max: MAX_KEYS } };
  const clean: EventData = {};
  for (const [key, value] of entries) {
    if (!KEY_PATTERN.test(key)) return { ok: false, problem: { code: 'invalid_data_key', key } };
    const fine =
      value === null ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      (typeof value === 'string' && value.length <= MAX_TEXT);
    if (!fine) return { ok: false, problem: { code: 'invalid_value', key, max: MAX_TEXT } };
    clean[key] = value as DataValue;
  }

  const type = opts.types.get(event);
  if (!type && opts.strict) return { ok: false, problem: { code: 'unknown_event' } };
  if (type) {
    const known = new Map(type.fields.map((f) => [f.key, f]));
    for (const f of type.fields) {
      if (f.required && (clean[f.key] === undefined || clean[f.key] === null)) {
        return { ok: false, problem: { code: 'missing_key', key: f.key } };
      }
    }
    for (const [key, value] of Object.entries(clean)) {
      const spec = known.get(key);
      if (!spec) {
        if (opts.strict) return { ok: false, problem: { code: 'unknown_key', key } };
        continue;
      }
      if (value !== null && typeof value !== spec.type) {
        return { ok: false, problem: { code: 'wrong_type', key, expected: spec.type } };
      }
    }
  }

  const json = JSON.stringify(clean);
  if (new TextEncoder().encode(json).length > opts.payloadBytes) {
    return { ok: false, problem: { code: 'payload_too_large', max: opts.payloadBytes } };
  }
  return { ok: true, event: { channel, event, data: clean, json } };
}

/**
 * Checks the event types a member saves in the dashboard: valid, distinct names and keys.
 * Returns the cleaned list, or the index of the first bad one.
 */
export function checkEventTypes(
  input: unknown,
  max: number,
):
  | { ok: true; types: EventType[] }
  | { ok: false; index: number; reason: 'name' | 'fields' | 'count' } {
  if (!Array.isArray(input)) return { ok: false, index: 0, reason: 'fields' };
  if (input.length > max) return { ok: false, index: max, reason: 'count' };
  const names = new Set<string>();
  const types: EventType[] = [];
  for (const [index, raw] of input.entries()) {
    const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
    if (!EVENT_PATTERN.test(name) || names.has(name)) return { ok: false, index, reason: 'name' };
    names.add(name);
    const fields = Array.isArray(raw?.fields) ? raw.fields : null;
    if (!fields || fields.length > MAX_FIELDS) return { ok: false, index, reason: 'fields' };
    const keys = new Set<string>();
    const clean: FieldSpec[] = [];
    for (const f of fields) {
      const key = typeof f?.key === 'string' ? f.key.trim() : '';
      if (!KEY_PATTERN.test(key) || keys.has(key) || !FIELD_TYPES.includes(f?.type)) {
        return { ok: false, index, reason: 'fields' };
      }
      keys.add(key);
      clean.push({ key, type: f.type, required: f.required === true });
    }
    types.push({ name, fields: clean });
  }
  return { ok: true, types };
}

/** An example `data` object for an event type (documentation and the live test). */
export function exampleData(type: EventType | undefined): EventData {
  if (!type || type.fields.length === 0) return { text: 'Hello' };
  return Object.fromEntries(
    type.fields.map((f) => [f.key, f.type === 'number' ? 1 : f.type === 'boolean' ? true : 'text']),
  );
}
