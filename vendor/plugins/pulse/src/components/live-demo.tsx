'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, buttonClass, cn, useT } from '@devquake/ui';
import {
  STAMP_FROM,
  STAMP_SENT_AT,
  byteSize,
  clockOffset,
  demoEvent,
  newBrowserName,
  parseDemoJson,
  summarize,
  timing,
  type DemoProblem,
  type Summary,
  type Timing,
} from '../lib/demo';
import type { Envelope, EventData } from '../lib/envelope';
import { callApi, errorMessage } from './call-api';
import { useApiError } from './live-test';
import { fieldClass } from './ui';

type Status = 'starting' | 'live' | 'polling' | { error: string };

interface Arrival {
  envelope: Envelope;
  from: string;
  mine: boolean;
  timing: Timing;
}

interface Sent {
  id: string;
  requestMs: number;
  bytes: number;
}

const SAMPLE_JSON = `{
  "product": "Coffee",
  "price": 3.5,
  "inStock": true,
  "note": "Any flat key:value data"
}`;
const BROWSER_KEY = 'dq-pulse:demo-browser';
const CHART_BARS = 20;

/**
 * The live demo (ADR 0029): this browser gets a demo client token for the member's private demo
 * channel, listens live (Server-Sent Events, polling as fallback) and sends events through the
 * real API. Events from the member's other browser show up here with where the time went.
 */
export function LiveDemo({ pageUrl }: { pageUrl: string }) {
  const t = useT('demo');
  const tErr = useT('errors');
  const apiError = useApiError();
  const [browser, setBrowser] = useState('');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState<Status>('starting');
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [sent, setSent] = useState<Sent[]>([]);
  const [mode, setMode] = useState<'message' | 'json'>('message');
  const [message, setMessage] = useState('');
  const [json, setJson] = useState(SAMPLE_JSON);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const token = useRef<string | null>(null);
  const offset = useRef(0);
  const lastId = useRef<string | null>(null);
  const source = useRef<EventSource | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const alive = useRef(true);
  const myName = useRef('');

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const receive = useCallback((e: Envelope) => {
    lastId.current = e.id;
    const receivedAt = Date.now() + offset.current;
    const sentAt =
      typeof e.data[STAMP_SENT_AT] === 'number' ? (e.data[STAMP_SENT_AT] as number) : null;
    const from = typeof e.data[STAMP_FROM] === 'string' ? (e.data[STAMP_FROM] as string) : '?';
    setArrivals((list) =>
      list.some((a) => a.envelope.id === e.id)
        ? list
        : [
            {
              envelope: e,
              from,
              mine: from === myName.current,
              timing: timing(sentAt, Date.parse(e.at), receivedAt),
            },
            ...list,
          ].slice(0, 100),
    );
  }, []);

  // Live connection with polling as fallback (as any browser of a member's website would do).
  const poll = useCallback(async () => {
    if (!alive.current || !token.current) return;
    const q = new URLSearchParams({ token: token.current, channels: channel });
    if (lastId.current) q.set('after', lastId.current);
    const res = await fetch(`/api/v1/poll?${q}`, { cache: 'no-store' }).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    if (!res?.ok) {
      setStatus({ error: apiError(body) });
      if (res && [401, 402, 403].includes(res.status)) return;
    } else {
      for (const e of body.events as Envelope[]) receive(e);
      lastId.current = body.next ?? lastId.current;
      setStatus('polling');
    }
    later(() => void poll(), body?.retryAfterMs ?? 3000);
  }, [apiError, channel, receive]);

  const open = useCallback(() => {
    if (!alive.current || !token.current || !channel) return;
    source.current?.close();
    const q = new URLSearchParams({ token: token.current, channels: channel });
    if (lastId.current) q.set('after', lastId.current);
    const es = new EventSource(`/api/v1/stream?${q}`);
    source.current = es;
    let hello = false;
    es.addEventListener('hello', () => {
      hello = true;
      setStatus('live');
    });
    es.onmessage = (m) => {
      try {
        receive(JSON.parse(m.data));
      } catch {
        // not an event
      }
    };
    es.addEventListener('bye', () => {
      es.close();
      later(open, 250);
    });
    es.onerror = () => {
      if (hello) return; // the browser reconnects by itself
      es.close();
      void poll();
    };
  }, [channel, poll, receive]);

  // The newest `open` (timers set earlier must not use one made before the channel was known).
  const openRef = useRef(open);
  openRef.current = open;

  // 1. Line the clock up with the server's (best of three), 2. a demo token, renewed in time.
  const fetchToken = useCallback(
    async (name: string) => {
      const r = await callApi<{
        token: string;
        channel: string;
        browser: string;
        expiresInSeconds: number;
      }>('/demo/token', 'POST', { browser: name });
      token.current = r!.token;
      setChannel(r!.channel);
      // Renewed a minute before it ends, then the live connection reopens with the new one.
      later(
        () => {
          void fetchToken(name)
            .then(() => openRef.current())
            .catch((err) => setStatus({ error: errorMessage(err, tErr) }));
        },
        Math.max(30, r!.expiresInSeconds - 60) * 1000,
      );
    },
    [tErr],
  );

  useEffect(() => {
    alive.current = true;
    let name = '';
    try {
      name = sessionStorage.getItem(BROWSER_KEY) ?? '';
    } catch {
      // storage blocked: a new name each visit
    }
    if (!name) name = newBrowserName();
    try {
      sessionStorage.setItem(BROWSER_KEY, name);
    } catch {
      // ignore
    }
    myName.current = name;
    setBrowser(name);
    (async () => {
      let best = Infinity;
      for (let i = 0; i < 3; i++) {
        const t0 = Date.now();
        const res = await fetch('/api/health', { cache: 'no-store' }).catch(() => null);
        const t1 = Date.now();
        const body = res ? await res.json().catch(() => null) : null;
        if (body?.time && t1 - t0 < best) {
          best = t1 - t0;
          offset.current = clockOffset(t0, t1, Date.parse(body.time));
        }
      }
      try {
        await fetchToken(name);
      } catch (err) {
        setStatus({ error: errorMessage(err, tErr) });
      }
    })();
    return () => {
      alive.current = false;
      source.current?.close();
      for (const id of timers.current) clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect once the channel is known (and again after a new token).
  useEffect(() => {
    if (channel) open();
  }, [channel, open]);

  // What will be sent: the member's part, checked as they type.
  const parsed = useMemo<{ data: EventData | null; problem: DemoProblem | null }>(() => {
    if (mode === 'message') {
      const text = message.trim();
      return text
        ? { data: { text: text.slice(0, 500) }, problem: null }
        : { data: null, problem: null };
    }
    const r = parseDemoJson(json);
    return r.ok ? { data: r.data, problem: null } : { data: null, problem: r.problem };
  }, [mode, message, json]);

  const preview = demoEvent({
    channel: channel || 'private-demo-…',
    mode,
    data: parsed.data ?? (mode === 'message' ? { text: '…' } : {}),
    browser: browser || '…',
    sentAt: Date.now() + offset.current,
  });

  async function send() {
    if (!parsed.data || !token.current) return;
    setSending(true);
    setResult(null);
    const event = demoEvent({
      channel,
      mode,
      data: parsed.data,
      browser,
      sentAt: Date.now() + offset.current,
    });
    const t0 = performance.now();
    const res = await fetch('/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.current}` },
      body: JSON.stringify(event),
    }).catch(() => null);
    const requestMs = Math.round(performance.now() - t0);
    const body = res ? await res.json().catch(() => null) : null;
    if (res?.ok) {
      setSent((list) =>
        [{ id: String(body?.id ?? '?'), requestMs, bytes: byteSize(event) }, ...list].slice(0, 100),
      );
      setResult({ ok: true, text: t('sent', { id: body?.id ?? '?', ms: requestMs }) });
      if (mode === 'message') setMessage('');
    } else {
      setResult({ ok: false, text: apiError(body) });
    }
    setSending(false);
  }

  const fromOthers = arrivals.filter((a) => !a.mine);
  const totals = fromOthers.map((a) => a.timing.total).filter((v): v is number => v !== null);
  const others = summarize(totals);
  const toServer = summarize(
    fromOthers.map((a) => a.timing.toServer).filter((v): v is number => v !== null),
  );
  const toHere = summarize(fromOthers.map((a) => a.timing.toHere));
  const ownRoundTrip = summarize(
    arrivals
      .filter((a) => a.mine)
      .map((a) => a.timing.total)
      .filter((v): v is number => v !== null),
  );
  const requests = summarize(sent.map((s) => s.requestMs));
  const browsers = [...new Set(arrivals.map((a) => a.from).filter((f) => f !== browser))];
  const statusText =
    typeof status === 'object'
      ? t('status.error', { reason: status.error })
      : t(`status.${status}`);
  const ms = (v: number | null) => (v === null ? '–' : t('ms', { ms: v }));

  return (
    <div className="space-y-6">
      {/* How to try it: this page in a second browser, signed in to the same account. */}
      <section className="space-y-3 rounded-xl border border-quake/40 bg-quake/5 p-5">
        <h2 className="font-display text-xl font-bold">{t('howTitle')}</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>{t('how1')}</li>
          <li>{t('how2')}</li>
          <li>{t('how3')}</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-md bg-white px-2 py-1 text-sm break-all dark:bg-ink">
            {pageUrl}
          </code>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pageUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? t('copied') : t('copy')}
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <p>
          {t('thisBrowser')}{' '}
          <span className="rounded-md bg-ink px-2 py-0.5 font-mono font-bold text-paper dark:bg-paper dark:text-ink">
            {browser || '…'}
          </span>
        </p>
        <p role="status" className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn(
              'inline-block size-2.5 rounded-full',
              status === 'live'
                ? 'bg-emerald-500'
                : status === 'polling'
                  ? 'bg-amber-500'
                  : typeof status === 'object'
                    ? 'bg-red-500'
                    : 'bg-ink/30 dark:bg-paper/30',
            )}
          />
          {statusText}
        </p>
        <p>
          {browsers.length ? t('otherBrowsers', { names: browsers.join(', ') }) : t('waitingOther')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send */}
        <section className="space-y-3 rounded-xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5">
          <h2 className="font-display text-xl font-bold">{t('sendTitle')}</h2>
          <div
            role="radiogroup"
            aria-label={t('modeLabel')}
            className="inline-flex rounded-lg border border-ink/15 p-1 text-sm dark:border-paper/15"
          >
            {(['message', 'json'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium',
                  mode === m
                    ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                    : 'hover:bg-ink/5 dark:hover:bg-paper/10',
                )}
              >
                {t(`modes.${m}`)}
              </button>
            ))}
          </div>
          {mode === 'message' ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t('message')}</span>
              <textarea
                className={cn(fieldClass, 'min-h-24')}
                maxLength={500}
                value={message}
                placeholder={t('messagePlaceholder')}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t('json')}</span>
              <textarea
                className={cn(fieldClass, 'min-h-40 font-mono text-xs')}
                spellCheck={false}
                value={json}
                onChange={(e) => setJson(e.target.value)}
              />
              <span className="mt-1 block text-xs text-ink/60 dark:text-paper/60">
                {t('jsonHint')}
              </span>
            </label>
          )}
          <p className="min-h-5 text-sm text-red-700 dark:text-red-400" role="alert">
            {parsed.problem
              ? t(`problems.${parsed.problem.code}`, problemValues(parsed.problem))
              : ''}
          </p>

          <div>
            <p className="mb-1 flex flex-wrap items-center gap-2 text-sm font-medium">
              {t('frameTitle')}
              <span className="text-xs font-normal text-ink/60 dark:text-paper/60">
                {t('frameHint')}
              </span>
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-ink p-3 text-xs text-paper dark:bg-black/40">
              {JSON.stringify(preview, null, 2)}
            </pre>
            <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
              {['channel', 'event', STAMP_FROM, STAMP_SENT_AT].map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-ink/10 px-2 py-0.5 font-mono dark:bg-paper/15"
                >
                  🔒 {k}
                </span>
              ))}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={buttonClass('primary', 'min-h-11')}
              disabled={sending || !parsed.data || !channel}
              onClick={() => void send()}
            >
              {sending ? t('sending') : t('send')}
            </button>
            <span
              role="status"
              className={cn(
                'min-h-5 text-sm',
                result && !result.ok && 'text-red-700 dark:text-red-400',
              )}
            >
              {result ? `${result.ok ? '✓ ' : ''}${result.text}` : ''}
            </span>
          </div>
        </section>

        {/* Statistics */}
        <section className="space-y-4 rounded-xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5">
          <h2 className="font-display text-xl font-bold">{t('statsTitle')}</h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label={t('stats.fromOthers')} value={String(others.count)} />
            <Tile
              label={t('stats.average')}
              value={ms(others.average)}
              hint={t('stats.endToEnd')}
            />
            <Tile
              label={t('stats.minMax')}
              value={others.count ? `${others.min} / ${others.max}` : '–'}
              hint={t('stats.msUnit')}
            />
            <Tile
              label={t('stats.toServer')}
              value={ms(toServer.average)}
              hint={t('stats.averageShort')}
            />
            <Tile
              label={t('stats.toHere')}
              value={ms(toHere.average)}
              hint={t('stats.averageShort')}
            />
            <Tile
              label={t('stats.sent')}
              value={String(sent.length)}
              hint={requests.count ? t('stats.request', { ms: requests.average ?? 0 }) : undefined}
            />
            <Tile
              label={t('stats.ownRoundTrip')}
              value={ms(ownRoundTrip.average)}
              hint={t('stats.ownRoundTripHint')}
            />
            <Tile
              label={t('stats.transport')}
              value={
                status === 'live' ? t('stats.sse') : status === 'polling' ? t('stats.polling') : '–'
              }
            />
            <Tile
              label={t('stats.lastSize')}
              value={sent[0] ? t('bytes', { bytes: sent[0].bytes }) : '–'}
            />
          </dl>
          <LatencyBars values={totals.slice(0, CHART_BARS).reverse()} summary={others} />
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('clockNote')}</p>
        </section>
      </div>

      {/* Received */}
      <section className="space-y-3 rounded-xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5">
        <h2 className="font-display text-xl font-bold">{t('receivedTitle')}</h2>
        {arrivals.length === 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('receivedEmpty')}</p>
        ) : (
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
            {arrivals.map((a) => (
              <li
                key={a.envelope.id}
                className={cn(
                  'rounded-lg border p-3 text-sm',
                  a.mine
                    ? 'border-ink/10 opacity-70 dark:border-paper/10'
                    : 'border-quake/50 bg-quake/5',
                )}
              >
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">
                    {a.mine ? t('fromHere') : t('fromBrowser', { name: a.from })}
                  </span>
                  <span className="font-mono text-xs text-ink/60 dark:text-paper/60">
                    {a.envelope.event} · #{a.envelope.id}
                  </span>
                  <span className="ml-auto text-xs tabular-nums">
                    {t('timing', {
                      toServer: a.timing.toServer ?? '–',
                      toHere: a.timing.toHere,
                      total: a.timing.total ?? '–',
                    })}
                  </span>
                </p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-ink/5 p-2 font-mono text-xs dark:bg-paper/10">
                  {JSON.stringify(a.envelope, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function problemValues(p: DemoProblem): Record<string, string | number> {
  return 'key' in p
    ? { key: p.key, max: 'max' in p ? p.max : '' }
    : 'max' in p
      ? { max: p.max }
      : {};
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-ink/[0.04] p-2.5 dark:bg-paper/5">
      <dt className="text-xs text-ink/60 dark:text-paper/60">{label}</dt>
      <dd className="font-display text-xl font-bold tabular-nums">{value}</dd>
      {hint ? <dd className="text-[11px] text-ink/50 dark:text-paper/50">{hint}</dd> : null}
    </div>
  );
}

/**
 * End-to-end times of the latest events from the other browser, oldest first: one bar each,
 * the average as a line; every value is also in the list below (hover for the exact number).
 */
function LatencyBars({ values, summary }: { values: number[]; summary: Summary }) {
  const t = useT('demo');
  if (values.length === 0) return null;
  const max = Math.max(1, ...values);
  const w = 300;
  const h = 80;
  const bar = w / CHART_BARS;
  const y = (v: number) => h - (v / max) * (h - 12);
  return (
    <figure>
      <svg
        viewBox={`0 0 ${w} ${h + 14}`}
        className="h-auto w-full"
        role="img"
        aria-label={t('chartLabel', { average: summary.average ?? 0, max })}
      >
        {values.map((v, i) => (
          <rect
            key={i}
            x={i * bar + 2}
            y={y(v)}
            width={bar - 4}
            height={h - y(v)}
            rx="2"
            fill="#ea580c"
          >
            <title>{t('ms', { ms: v })}</title>
          </rect>
        ))}
        {summary.average !== null ? (
          <g>
            <line
              x1="0"
              x2={w}
              y1={y(summary.average)}
              y2={y(summary.average)}
              stroke="currentColor"
              strokeOpacity=".45"
              strokeDasharray="4 3"
            />
            <text
              x={w - 2}
              y={y(summary.average) - 3}
              textAnchor="end"
              fontSize="9"
              fill="currentColor"
              opacity=".7"
            >
              {t('chartAverage', { ms: summary.average })}
            </text>
          </g>
        ) : null}
        <line x1="0" x2={w} y1={h} y2={h} stroke="currentColor" strokeOpacity=".2" />
        <text x="0" y={h + 11} fontSize="9" fill="currentColor" opacity=".6">
          {t('chartCaption', { count: values.length })}
        </text>
      </svg>
    </figure>
  );
}
