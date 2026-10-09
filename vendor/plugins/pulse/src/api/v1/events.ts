import { checkEvent } from '../../lib/envelope';
import { ApiError, apiJson, countRejected, mayPublish, preflight } from '../../lib/gateway';
import { hub } from '../../lib/hub';
import { keyApi } from '../../lib/key-api';
import { DEMO_BURST, DEMO_PER_MINUTE, demoMember } from '../../lib/demo';
import { Buckets } from '../../lib/rate';

// POST https://pulse.devquake.com/api/v1/events — send one event (key route, ADR 0023).
// Body: { "channel": "orders", "event": "order.created", "data": { key: value, … } }
// Auth: Authorization: Bearer sk_… (server), Bearer <client token>, or X-Pulse-Key: pk_… (browser
// on a verified website, when the app allows browsers to send). Answers 202 { id, at }.

const MAX_BODY = 16 * 1024;
const buckets = new Buckets();

export const OPTIONS = preflight;

export const POST = keyApi(async ({ request, db, caller }) => {
  const { entry, limits } = caller;
  const appId = entry.app.id;
  const now = Date.now();

  // Per-app rate in this process (sustained + burst); the daily count below covers all processes.
  if (!buckets.take(`app:${appId}`, limits.eventsPerMinute, limits.burst, now)) {
    await countRejected(db, appId);
    const wait = Math.max(
      1,
      Math.ceil(buckets.waitMs(`app:${appId}`, limits.eventsPerMinute) / 1000),
    );
    throw new ApiError(429, 'rate_limited', wait);
  }
  // The demo service is shared: each member has their own, smaller allowance.
  const member = entry.app.demo === 1 ? demoMember(caller.sender) : null;
  if (member && !buckets.take(`demo:${member}`, DEMO_PER_MINUTE, DEMO_BURST, now)) {
    const wait = Math.max(1, Math.ceil(buckets.waitMs(`demo:${member}`, DEMO_PER_MINUTE) / 1000));
    throw new ApiError(429, 'rate_limited', wait);
  }

  const text = await request.text();
  if (text.length > MAX_BODY) throw new ApiError(413, 'body_too_large');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const checked = checkEvent(body, {
    types: entry.types,
    strict: entry.app.strict_schema === 1,
    payloadBytes: limits.payloadBytes,
  });
  if (!checked.ok) {
    await countRejected(db, appId);
    return apiJson(
      checked.problem.code === 'payload_too_large' ? 413 : 400,
      { error: { ...checked.problem, message: `Event refused: ${checked.problem.code}` } },
      caller.origin,
    );
  }
  const { event } = checked;
  const allowed = mayPublish(caller, event.channel);
  if (allowed !== 'ok') throw new ApiError(403, allowed);

  const [today] = await db.query<{ events: number }>(
    'SELECT events FROM usage_daily WHERE app_id = ? AND day = UTC_DATE()',
    [appId],
  );
  if (Number(today?.events ?? 0) >= limits.eventsPerDay) {
    await countRejected(db, appId);
    throw new ApiError(429, 'daily_limit', 3600);
  }

  const { insertId } = await db.execute(
    'INSERT INTO events (app_id, channel, event, data, source, sender) VALUES (?, ?, ?, ?, ?, ?)',
    [appId, event.channel, event.event, event.json, caller.source, caller.sender ?? null],
  );
  await db.execute(
    `INSERT INTO usage_daily (app_id, day, events) VALUES (?, UTC_DATE(), 1)
     ON DUPLICATE KEY UPDATE events = events + 1`,
    [appId],
  );
  hub.poke();
  return apiJson(202, { id: String(insertId), at: new Date(now).toISOString() }, caller.origin);
});
