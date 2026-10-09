import { eventId, eventsSince } from '../../lib/catch-up';
import { parseChannels } from '../../lib/envelope';
import { ApiError, corsHeaders, mayListen, preflight } from '../../lib/gateway';
import { hub, type Listener } from '../../lib/hub';
import { randomId } from '../../lib/keys';
import { keyApi } from '../../lib/key-api';
import { maxStreamsPerProcess } from '../../lib/limits';

// GET https://pulse.devquake.com/api/v1/stream?key=pk_…&channels=a,b[&token=…] — live events as
// Server-Sent Events (key route, ADR 0023). Every message is one event envelope (JSON), with its
// id, so a reconnecting EventSource continues where it stopped (Last-Event-ID). The connection
// is closed after the plan's time and the browser reconnects by itself (`retry`).

export const OPTIONS = preflight;

const HEARTBEAT_MS = 15_000;

export const GET = keyApi(async ({ request, db, caller, query }) => {
  const { entry, limits } = caller;
  const channels = parseChannels(query.get('channels'), limits.channelsPerConnection);
  if (!channels) throw new ApiError(400, 'invalid_channels');
  if (!channels.every((c) => mayListen(caller, c))) throw new ApiError(403, 'channel_not_allowed');

  // The site's connection slots are shared: never more than this per process.
  if (hub.size >= maxStreamsPerProcess()) throw new ApiError(503, 'busy', 15);
  const [open] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM streams WHERE app_id = ? AND seen_at > UTC_TIMESTAMP() - INTERVAL 90 SECOND',
    [entry.app.id],
  );
  if (Number(open?.n ?? 0) >= limits.connections)
    throw new ApiError(429, 'too_many_connections', 30);

  const id = randomId(16);
  await db.execute('INSERT INTO streams (id, app_id) VALUES (?, ?)', [id, entry.app.id]);
  const app = { id: entry.app.id, publicKey: entry.app.public_key };
  const resumeFrom = eventId(request.headers.get('last-event-id') ?? query.get('after'));
  const missed =
    resumeFrom === null
      ? []
      : await eventsSince(
          db,
          app,
          channels,
          resumeFrom,
          limits.historyMinutes,
          limits.deliveryDelayMs,
          200,
        );

  const encoder = new TextEncoder();
  let closed = false;
  let timers: ReturnType<typeof setTimeout>[] = [];
  const cleanup = () => {
    if (closed) return;
    closed = true;
    timers.forEach((t) => clearTimeout(t));
    timers = [];
    hub.remove(id);
    void db.execute('DELETE FROM streams WHERE id = ?', [id]).catch(() => undefined);
  };

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          cleanup();
        }
      };
      // Padding first: some proxies hold small responses back before passing them on.
      write(`:${' '.repeat(2048)}\n`);
      write(`retry: ${limits.reconnectMs}\n\n`);
      write(
        `event: hello\ndata: ${JSON.stringify({ channels, plan: caller.plan, closesInSeconds: limits.streamSeconds })}\n\n`,
      );
      const send: Listener['send'] = (e) => write(`id: ${e.id}\ndata: ${JSON.stringify(e)}\n\n`);
      for (const e of missed) send(e);
      const listener: Listener = {
        id,
        appId: app.id,
        publicKey: app.publicKey,
        channels: new Set(channels),
        delayMs: limits.deliveryDelayMs,
        cursor: missed.length
          ? Number(missed[missed.length - 1]!.id)
          : (resumeFrom ?? (await hub.latestId(db))),
        queue: [],
        send,
      };
      await hub.add(db, listener);
      const beat = () => {
        write(': ping\n\n');
        if (!closed) timers.push(setTimeout(beat, HEARTBEAT_MS));
      };
      timers.push(setTimeout(beat, HEARTBEAT_MS));
      timers.push(
        setTimeout(() => {
          write('event: bye\ndata: {"reconnect":true}\n\n');
          cleanup();
          try {
            controller.close();
          } catch {
            // already closed
          }
        }, limits.streamSeconds * 1000),
      );
      request.signal.addEventListener('abort', cleanup);
    },
    cancel: cleanup,
  });

  return new Response(body, {
    headers: {
      ...corsHeaders(caller.origin),
      'Content-Type': 'text/event-stream; charset=utf-8',
      // no-transform: no compression (it would hold events back).
      'Cache-Control': 'no-cache, no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
});
