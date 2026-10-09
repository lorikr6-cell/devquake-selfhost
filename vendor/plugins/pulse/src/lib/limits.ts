// What each kind of member may do (ADR 0023). Pure, so pages, the API and tests share it.
//
// The whole service runs inside the DevQuake site on managed hosting, where every open live
// connection takes one of a limited number of slots. The limits keep one member from taking the
// site down: trial use is deliberately slow and small; subscribers get a fair everyday amount;
// "full" (unlimited use, later paid) is granted by DevQuake on request.

export type Plan = 'trial' | 'standard' | 'full';

export interface Limits {
  /** API services (apps) the member may have. */
  apps: number;
  /** Websites per app. */
  origins: number;
  /** Event types (key:value structures) per app. */
  eventTypes: number;
  /** Live connections open at the same time, per app. */
  connections: number;
  /** Channels one connection may listen to. */
  channelsPerConnection: number;
  /** Events per app and UTC day. */
  eventsPerDay: number;
  /** Events per app and minute (sustained rate)... */
  eventsPerMinute: number;
  /** ...and how many may come at once (burst). */
  burst: number;
  /** Largest `data` object, in bytes of JSON. */
  payloadBytes: number;
  /** Events reach listeners this late (a trial is noticeably slower). */
  deliveryDelayMs: number;
  /** A live connection is closed after this long; the browser reconnects by itself. */
  streamSeconds: number;
  /** How soon the browser reconnects (the SSE `retry`). */
  reconnectMs: number;
  /** Shortest time between two polls of one client (the fallback without live connections). */
  pollIntervalMs: number;
  /** How long events are kept for clients that reconnect and catch up. */
  historyMinutes: number;
}

export const LIMITS: Record<Plan, Limits> = {
  trial: {
    apps: 1,
    origins: 1,
    eventTypes: 3,
    connections: 3,
    channelsPerConnection: 3,
    eventsPerDay: 300,
    eventsPerMinute: 10,
    burst: 3,
    payloadBytes: 512,
    deliveryDelayMs: 3000,
    streamSeconds: 20,
    reconnectMs: 5000,
    pollIntervalMs: 5000,
    historyMinutes: 60,
  },
  standard: {
    apps: 3,
    origins: 5,
    eventTypes: 30,
    connections: 25,
    channelsPerConnection: 10,
    eventsPerDay: 10_000,
    eventsPerMinute: 120,
    burst: 10,
    payloadBytes: 2048,
    deliveryDelayMs: 0,
    streamSeconds: 50,
    reconnectMs: 1000,
    pollIntervalMs: 2000,
    historyMinutes: 24 * 60,
  },
  full: {
    apps: 20,
    origins: 20,
    eventTypes: 100,
    connections: 200,
    channelsPerConnection: 25,
    eventsPerDay: 250_000,
    eventsPerMinute: 1200,
    burst: 50,
    payloadBytes: 8192,
    deliveryDelayMs: 0,
    streamSeconds: 50,
    reconnectMs: 1000,
    pollIntervalMs: 1000,
    historyMinutes: 7 * 24 * 60,
  },
};

/** Keys of `LIMITS` shown on the plan comparison, in this order. */
export const SHOWN_LIMITS = [
  'apps',
  'connections',
  'eventsPerDay',
  'eventsPerMinute',
  'payloadBytes',
  'deliveryDelayMs',
  'historyMinutes',
] as const satisfies readonly (keyof Limits)[];

/**
 * Live connections one server process holds at most, for all members together (the host's
 * connection slots are shared with the whole site). PULSE_MAX_STREAMS overrides it.
 */
export function maxStreamsPerProcess(env: string | undefined = process.env.PULSE_MAX_STREAMS) {
  const n = Number(env);
  return Number.isInteger(n) && n > 0 && n <= 1000 ? n : 30;
}

/**
 * The plan of a member from their access to the app and their account row. A self-hosted
 * instance (ADR 0054) sets PULSE_DEFAULT_PLAN=full: its members get the full plan without a
 * DevQuake grant.
 */
export function planOf(
  access: 'member' | 'trial' | 'none',
  accountPlan: string | null,
  defaultPlan: string | undefined = process.env.PULSE_DEFAULT_PLAN,
): Plan | null {
  if (access === 'none') return null;
  if (access === 'trial') return 'trial';
  return accountPlan === 'full' || defaultPlan === 'full' ? 'full' : 'standard';
}
