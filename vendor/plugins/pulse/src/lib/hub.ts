import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { Envelope, EventData, EventSource } from './envelope';

// Delivery of events to live connections, per server process (ADR 0023). Server only.
//
// The site may run in several processes, so events are not passed around in memory: they are
// stored in `events` (by whichever process received them) and each process reads new rows once a
// second — ONE query per process, however many connections are open — and hands them to its own
// connections. An event received by this process is delivered at once (poke).

type Db = Omit<PluginDatabase, 'transaction'>;

export interface EventRow {
  id: number | string;
  app_id: number;
  channel: string;
  event: string;
  data: string;
  source: EventSource;
  sender: string | null;
  created_at: Date;
}

export interface Listener {
  id: string;
  appId: number;
  publicKey: string;
  channels: Set<string>;
  /** Events reach this listener this late (trial). */
  delayMs: number;
  /** Last event id handed to this listener. */
  cursor: number;
  queue: Envelope[];
  send(envelope: Envelope): void;
}

const TICK_MS = 1000;
const SEEN_EVERY_MS = 30_000;

export function toEnvelope(row: EventRow, publicKey: string): Envelope {
  let data: EventData = {};
  try {
    data = JSON.parse(row.data);
  } catch {
    // stored by this plugin, always JSON
  }
  return {
    id: String(row.id),
    app: publicKey,
    channel: row.channel,
    event: row.event,
    data,
    source: row.source,
    ...(row.sender ? { sender: row.sender } : {}),
    at: new Date(row.created_at).toISOString(),
  };
}

/** Hands queued events to the listener once they are old enough (trial delay). */
export function flush(listener: Listener, now: number) {
  while (listener.queue.length) {
    const next = listener.queue[0]!;
    if (Date.parse(next.at) + listener.delayMs > now) break;
    listener.queue.shift();
    listener.send(next);
  }
}

/** Queues rows for the listeners they belong to (by app, channel and cursor). */
export function route(rows: EventRow[], listeners: Iterable<Listener>) {
  for (const l of listeners) {
    for (const row of rows) {
      const id = Number(row.id);
      if (row.app_id !== l.appId || id <= l.cursor || !l.channels.has(row.channel)) continue;
      l.cursor = id;
      l.queue.push(toEnvelope(row, l.publicKey));
      if (l.queue.length > 500) l.queue.shift();
    }
  }
}

class Hub {
  private listeners = new Map<string, Listener>();
  private db: Db | null = null;
  private lastId = -1;
  private timer: ReturnType<typeof setInterval> | null = null;
  private busy = false;
  private seenAt = 0;
  /** Streams and polls per app since the last write to usage_daily. */
  private counts = new Map<number, { streams: number; polls: number }>();

  get size() {
    return this.listeners.size;
  }

  /** The newest event id (start position of a new connection). */
  async latestId(db: Db): Promise<number> {
    // While ticking, lastId is current; otherwise other processes may have added events.
    if (this.timer && this.lastId >= 0) return this.lastId;
    const [row] = await db.query<{ id: number | null }>('SELECT MAX(id) AS id FROM events');
    this.lastId = Math.max(this.lastId, Number(row?.id ?? 0));
    return this.lastId;
  }

  async add(db: Db, listener: Listener) {
    this.db = db;
    await this.latestId(db);
    this.listeners.set(listener.id, listener);
    this.count(listener.appId, 'streams');
    if (!this.timer) this.timer = setInterval(() => void this.tick(), TICK_MS);
  }

  remove(id: string) {
    this.listeners.delete(id);
    if (this.listeners.size === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      void this.flushCounts();
    }
  }

  count(appId: number, kind: 'streams' | 'polls', db?: Db) {
    if (db) this.db = db;
    const c = this.counts.get(appId) ?? { streams: 0, polls: 0 };
    c[kind] += 1;
    this.counts.set(appId, c);
    // Without live connections there is no tick: polls are written from here.
    const now = Date.now();
    if (!this.timer && now - this.seenAt > SEEN_EVERY_MS) {
      this.seenAt = now;
      void this.flushCounts();
    }
  }

  /** An event was stored by this process: deliver it without waiting for the next tick. */
  poke() {
    if (this.listeners.size) setTimeout(() => void this.tick(), 20);
  }

  private async tick() {
    if (this.busy || !this.db) return;
    this.busy = true;
    const now = Date.now();
    try {
      const rows = await this.db.query<EventRow>(
        `SELECT id, app_id, channel, event, data, source, sender, created_at FROM events
          WHERE id > ? ORDER BY id LIMIT 500`,
        [this.lastId],
      );
      if (rows.length) {
        this.lastId = Number(rows[rows.length - 1]!.id);
        route(rows, this.listeners.values());
      }
      for (const l of this.listeners.values()) flush(l, now);
      if (now - this.seenAt > SEEN_EVERY_MS) {
        this.seenAt = now;
        await this.markSeen();
        await this.flushCounts();
      }
    } catch (err) {
      console.error('[pulse] delivery failed', err);
    } finally {
      this.busy = false;
    }
  }

  /** Keeps this process's connections counted (other processes see them in `streams`). */
  private async markSeen() {
    const ids = [...this.listeners.keys()];
    if (!this.db || ids.length === 0) return;
    await this.db.execute(
      `UPDATE streams SET seen_at = UTC_TIMESTAMP() WHERE id IN (${ids.map(() => '?').join(', ')})`,
      ids,
    );
  }

  async flushCounts() {
    if (!this.db || this.counts.size === 0) return;
    const counts = [...this.counts];
    this.counts.clear();
    for (const [appId, c] of counts) {
      await this.db
        .execute(
          `INSERT INTO usage_daily (app_id, day, streams, polls) VALUES (?, UTC_DATE(), ?, ?)
           ON DUPLICATE KEY UPDATE streams = streams + VALUES(streams), polls = polls + VALUES(polls)`,
          [appId, c.streams, c.polls],
        )
        .catch(() => undefined);
    }
  }
}

const globalForHub = globalThis as unknown as { devquakePulseHub?: Hub };
/** This process's hub (kept across hot reloads in development). */
export const hub = (globalForHub.devquakePulseHub ??= new Hub());
