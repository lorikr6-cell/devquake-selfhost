import { eventId, eventsSince } from '../../lib/catch-up';
import { parseChannels } from '../../lib/envelope';
import { ApiError, apiJson, mayListen, preflight } from '../../lib/gateway';
import { hub } from '../../lib/hub';
import { keyApi } from '../../lib/key-api';
import { Once } from '../../lib/rate';

// GET https://pulse.devquake.com/api/v1/poll?key=pk_…&channels=a,b&after=<id> — the fallback
// where live connections do not work (key route, ADR 0023). Answers the events after `after`
// and `next` (pass it as `after` next time) and how long to wait before the next poll. Without
// `after`: no events, only `next` (start from now).

export const OPTIONS = preflight;

const gates = new Map<number, Once>();

export const GET = keyApi(async ({ db, caller, query }) => {
  const { entry, limits } = caller;
  const channels = parseChannels(query.get('channels'), limits.channelsPerConnection);
  if (!channels) throw new ApiError(400, 'invalid_channels');
  if (!channels.every((c) => mayListen(caller, c))) throw new ApiError(403, 'channel_not_allowed');

  // One client may not poll more often than its plan allows.
  const interval = limits.pollIntervalMs;
  const gate = gates.get(interval) ?? new Once(interval - 250);
  gates.set(interval, gate);
  const who = `${entry.app.id}:${caller.ip}:${query.get('token') ?? caller.source}:${channels.join(',')}`;
  if (!gate.pass(who, Date.now())) {
    throw new ApiError(429, 'poll_too_soon', Math.ceil(interval / 1000));
  }
  hub.count(entry.app.id, 'polls', db);

  const after = eventId(query.get('after'));
  const app = { id: entry.app.id, publicKey: entry.app.public_key };
  const events =
    after === null
      ? []
      : await eventsSince(db, app, channels, after, limits.historyMinutes, limits.deliveryDelayMs);
  const next = events.length
    ? events[events.length - 1]!.id
    : String(after ?? (await hub.latestId(db)));
  return apiJson(200, { events, next, retryAfterMs: interval }, caller.origin);
});
