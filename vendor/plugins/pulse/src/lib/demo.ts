import { KEY_PATTERN, MAX_KEYS, MAX_TEXT, type EventData } from './envelope';

/**
 * The live demo (ADR 0029): a member opens the demo page in two browsers; each gets a client
 * token of DevQuake's demo service for the member's own private channel, sends events through
 * the real API and receives the other browser's events live. The frame is fixed (channel, event
 * and two stamps); the member chooses the message or pastes their own flat JSON. Pure (shared by
 * the API, the page and the tests).
 */

/** Events per minute one member may send through the demo (on top of the service's limits). */
export const DEMO_PER_MINUTE = 30;
export const DEMO_BURST = 5;
/** A demo token lasts this long; the page asks for a new one before it ends. */
export const DEMO_TOKEN_SECONDS = 600;
/** Demo events are deleted after this many minutes. */
export const DEMO_KEEP_MINUTES = 60;
export const DEMO_EVENT_MESSAGE = 'demo.message';
export const DEMO_EVENT_JSON = 'demo.json';
/** Keys the demo adds to every event (they cannot be used in the pasted JSON). */
export const STAMP_FROM = 'demo_from';
export const STAMP_SENT_AT = 'demo_sent_at';

/** The member's private demo channel: only their own demo tokens can use it. */
export function demoChannel(userId: number): string {
  return `private-demo-u${userId}`;
}

/** A short name for one browser ("K7Q2"): letters and digits, 2–8 characters. */
export const BROWSER_PATTERN = /^[A-Z0-9]{2,8}$/;

export function newBrowserName(random: () => number = Math.random): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => letters[Math.floor(random() * letters.length)]).join('');
}

/** The client token's sender (`sub`): who and which browser ("u12.K7Q2"). */
export function demoSender(userId: number, browser: string): string {
  return `u${userId}.${browser}`;
}

/** The member a demo sender belongs to (for the per-member send limit), or null. */
export function demoMember(sender: string | undefined): string | null {
  const m = /^u(\d+)\.[A-Z0-9]{2,8}$/.exec(sender ?? '');
  return m ? m[1]! : null;
}

export type DemoProblem =
  | { code: 'notJson' }
  | { code: 'notObject' }
  | { code: 'empty' }
  | { code: 'tooManyKeys'; max: number }
  | { code: 'badKey'; key: string }
  | { code: 'reservedKey'; key: string }
  | { code: 'nested'; key: string }
  | { code: 'tooLong'; key: string; max: number };

/**
 * Checks pasted JSON for the demo: an object whose values are text, numbers, true/false or null
 * (Pulse data is flat), with valid keys and room for the demo's two stamps.
 */
export function parseDemoJson(
  text: string,
): { ok: true; data: EventData } | { ok: false; problem: DemoProblem } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, problem: { code: 'notJson' } };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, problem: { code: 'notObject' } };
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return { ok: false, problem: { code: 'empty' } };
  if (entries.length > MAX_KEYS - 2) {
    return { ok: false, problem: { code: 'tooManyKeys', max: MAX_KEYS - 2 } };
  }
  const data: EventData = {};
  for (const [key, v] of entries) {
    if (key === STAMP_FROM || key === STAMP_SENT_AT) {
      return { ok: false, problem: { code: 'reservedKey', key } };
    }
    if (!KEY_PATTERN.test(key)) return { ok: false, problem: { code: 'badKey', key } };
    if (v !== null && typeof v === 'object') return { ok: false, problem: { code: 'nested', key } };
    if (typeof v === 'string' && v.length > MAX_TEXT) {
      return { ok: false, problem: { code: 'tooLong', key, max: MAX_TEXT } };
    }
    if (!(v === null || ['string', 'number', 'boolean'].includes(typeof v))) {
      return { ok: false, problem: { code: 'nested', key } };
    }
    data[key] = v as EventData[string];
  }
  return { ok: true, data };
}

/** The whole event as it is sent: the fixed frame around the member's data. */
export function demoEvent(args: {
  channel: string;
  mode: 'message' | 'json';
  data: EventData;
  browser: string;
  /** Milliseconds on the server's clock (the browser's clock corrected by its offset). */
  sentAt: number;
}) {
  return {
    channel: args.channel,
    event: args.mode === 'message' ? DEMO_EVENT_MESSAGE : DEMO_EVENT_JSON,
    data: { ...args.data, [STAMP_FROM]: args.browser, [STAMP_SENT_AT]: Math.round(args.sentAt) },
  };
}

/**
 * The browser's clock offset to the server (server − browser, in ms), from one request: the
 * server's time is taken as halfway through the round trip.
 */
export function clockOffset(sentAt: number, receivedAt: number, serverTime: number): number {
  return serverTime - (sentAt + receivedAt) / 2;
}

export interface Timing {
  /** Sender's browser → stored on the server. */
  toServer: number | null;
  /** Server → this browser. */
  toHere: number;
  /** Sender's browser → this browser. */
  total: number | null;
}

/**
 * How long an event took, all on the server's clock: `sentAt` (stamped by the sender, corrected),
 * `storedAt` (the event's `at`), `receivedAt` (this browser's time, corrected).
 */
export function timing(sentAt: number | null, storedAt: number, receivedAt: number): Timing {
  const clamp = (ms: number) => Math.max(0, Math.round(ms));
  return {
    toServer: sentAt === null ? null : clamp(storedAt - sentAt),
    toHere: clamp(receivedAt - storedAt),
    total: sentAt === null ? null : clamp(receivedAt - sentAt),
  };
}

export interface Summary {
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
}

export function summarize(values: number[]): Summary {
  if (values.length === 0) return { count: 0, average: null, min: null, max: null };
  return {
    count: values.length,
    average: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/** Size of the event's JSON in bytes (UTF-8), as the API counts its data. */
export function byteSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}
