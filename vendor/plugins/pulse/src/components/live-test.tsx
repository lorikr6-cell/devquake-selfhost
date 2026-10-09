'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buttonClass, formatDateTime, useLocale, useT } from '@devquake/ui';
import type { Envelope, EventType, FieldType } from '../lib/envelope';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, Input, Toggle, fieldClass } from './ui';

type Status = 'idle' | 'connecting' | 'live' | 'polling' | 'closed' | { error: string };

interface Received extends Envelope {
  latencyMs: number;
}

interface Pair {
  key: string;
  type: FieldType;
  value: string;
}

/** Turns an API error body into a text in the page language. */
export function useApiError() {
  const t = useT('apiErrors');
  return useCallback(
    (body: unknown) => {
      const error = (body as { error?: Record<string, string | number> } | null)?.error ?? {};
      const code = String(error.code ?? 'unknown');
      const text = t(code, {
        key: String(error.key ?? ''),
        max: String(error.max ?? ''),
        expected: String(error.expected ?? ''),
      });
      return text === `apiErrors.${code}` || text === code ? t('unknown', { code }) : text;
    },
    [t],
  );
}

/**
 * The live test (ADR 0023): the owner listens here like a browser of their website would (with
 * the public key, or a 10-minute test client token for private channels) and sends events with
 * their own key:value data.
 */
export function LiveTest({
  appId,
  publicKey,
  maxChannels,
  eventTypes,
}: {
  appId: number;
  publicKey: string;
  maxChannels: number;
  eventTypes: EventType[];
}) {
  const t = useT('test');
  const tErr = useT('errors');
  const locale = useLocale();
  const apiError = useApiError();
  const [channels, setChannels] = useState('demo');
  const [useToken, setUseToken] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [received, setReceived] = useState<Received[]>([]);
  const [error, setError] = useState('');
  const source = useRef<EventSource | null>(null);
  const poller = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useRef<string | null>(null);
  const lastId = useRef<string | null>(null);
  const wanted = useRef(false);

  const [channel, setChannel] = useState('demo');
  const [eventName, setEventName] = useState(eventTypes[0]?.name ?? 'hello');
  const [pairs, setPairs] = useState<Pair[]>(() => pairsFor(eventTypes[0]));
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const auth = useCallback(
    (): Record<string, string> => (token.current ? { token: token.current } : { key: publicKey }),
    [publicKey],
  );

  const add = useCallback((e: Envelope) => {
    lastId.current = e.id;
    setReceived((list) =>
      [{ ...e, latencyMs: Date.now() - Date.parse(e.at) }, ...list].slice(0, 50),
    );
  }, []);

  const stop = useCallback(() => {
    wanted.current = false;
    source.current?.close();
    source.current = null;
    if (poller.current) clearTimeout(poller.current);
    poller.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const poll = useCallback(async () => {
    poller.current = null;
    if (!wanted.current) return;
    const q = new URLSearchParams({ ...auth(), channels });
    if (lastId.current) q.set('after', lastId.current);
    const res = await fetch(`/api/v1/poll?${q}`, { cache: 'no-store' }).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    if (!res || !res.ok) {
      setStatus({ error: apiError(body) });
      if (res && [401, 402, 403].includes(res.status)) return;
    } else {
      for (const e of body.events as Envelope[]) add(e);
      lastId.current = body.next;
      setStatus('polling');
    }
    poller.current = setTimeout(() => void poll(), body?.retryAfterMs ?? 5000);
  }, [channels, add, apiError, auth]);

  const open = useCallback(() => {
    if (!wanted.current) return;
    setStatus('connecting');
    const q = new URLSearchParams({ ...auth(), channels });
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
        add(JSON.parse(m.data));
      } catch {
        // not an event
      }
    };
    es.addEventListener('bye', () => {
      es.close();
      setTimeout(open, 250);
    });
    es.onerror = () => {
      if (hello) return; // the browser reconnects by itself
      es.close();
      // The poll answers with the reason (or works where live connections do not).
      void poll();
    };
  }, [channels, add, poll, auth]);

  async function connect() {
    stop();
    setError('');
    setReceived([]);
    lastId.current = null;
    token.current = null;
    wanted.current = true;
    if (useToken) {
      try {
        const r = await callApi<{ token: string }>(`/apps/${appId}/test-token`, 'POST', {
          channels,
          publish: true,
        });
        token.current = r?.token ?? null;
      } catch (err) {
        setError(errorMessage(err, tErr));
        wanted.current = false;
        return;
      }
    }
    open();
  }

  async function send() {
    setSending(true);
    setSendResult(null);
    const data: Record<string, string | number | boolean> = {};
    for (const p of pairs) {
      if (!p.key.trim()) continue;
      data[p.key.trim()] =
        p.type === 'number' ? Number(p.value) : p.type === 'boolean' ? p.value === 'true' : p.value;
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token.current) headers.Authorization = `Bearer ${token.current}`;
    else headers['X-Pulse-Key'] = publicKey;
    const res = await fetch('/api/v1/events', {
      method: 'POST',
      headers,
      body: JSON.stringify({ channel, event: eventName, data }),
    }).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    setSendResult(
      res?.ok
        ? { ok: true, text: t('sent', { id: body?.id ?? '?' }) }
        : { ok: false, text: apiError(body) },
    );
    setSending(false);
  }

  const connected = status !== 'idle' && status !== 'closed' && wanted.current;
  const statusText =
    typeof status === 'object'
      ? t('status.error', { reason: status.error })
      : t(`status.${status}`);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5">
        <h2 className="font-display text-xl font-bold">{t('listen')}</h2>
        <Field label={t('channels')} hint={t('channelsHint', { max: maxChannels })}>
          <Input
            value={channels}
            disabled={connected}
            onChange={(e) => setChannels(e.target.value)}
          />
        </Field>
        <Toggle
          label={t('useToken')}
          hint={t('useTokenHint')}
          checked={useToken}
          disabled={connected}
          onChange={setUseToken}
        />
        <div className="flex flex-wrap items-center gap-3">
          {connected ? (
            <button
              type="button"
              className={buttonClass('secondary', 'min-h-11')}
              onClick={() => {
                stop();
                setStatus('closed');
              }}
            >
              {t('disconnect')}
            </button>
          ) : (
            <button
              type="button"
              className={buttonClass('primary', 'min-h-11')}
              onClick={() => void connect()}
            >
              {t('connect')}
            </button>
          )}
          <span role="status" className="text-sm">
            <span
              aria-hidden
              className={`mr-1.5 inline-block size-2.5 rounded-full ${
                status === 'live'
                  ? 'bg-emerald-500'
                  : status === 'polling'
                    ? 'bg-amber-500'
                    : typeof status === 'object'
                      ? 'bg-red-500'
                      : 'bg-ink/30 dark:bg-paper/30'
              }`}
            />
            {statusText}
          </span>
        </div>
        <ErrorText>{error}</ErrorText>
        <h3 className="pt-2 font-semibold">{t('received')}</h3>
        {received.length === 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('receivedEmpty')}</p>
        ) : (
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
            {received.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-ink/10 p-2 text-xs dark:border-paper/10"
              >
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-semibold">{e.event}</span>
                  <span className="text-ink/60 dark:text-paper/60">#{e.channel}</span>
                  <span className="text-ink/60 dark:text-paper/60">{t(`sources.${e.source}`)}</span>
                  <span className="ml-auto tabular-nums">
                    {formatDateTime(
                      e.at,
                      Intl.DateTimeFormat().resolvedOptions().timeZone,
                      'time',
                      locale,
                    )}
                    {' · '}
                    {t('latency', { ms: Math.max(0, e.latencyMs) })}
                  </span>
                </div>
                <pre className="mt-1 overflow-x-auto font-mono">{JSON.stringify(e.data)}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5">
        <h2 className="font-display text-xl font-bold">{t('send')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('channel')}>
            <Input value={channel} onChange={(e) => setChannel(e.target.value)} />
          </Field>
          <Field label={t('event')}>
            <Input
              value={eventName}
              list="pulse-event-types"
              onChange={(e) => {
                setEventName(e.target.value);
                const type = eventTypes.find((ty) => ty.name === e.target.value);
                if (type) setPairs(pairsFor(type));
              }}
            />
            <datalist id="pulse-event-types">
              {eventTypes.map((ty) => (
                <option key={ty.name} value={ty.name} />
              ))}
            </datalist>
          </Field>
        </div>
        <p className="text-sm font-medium">{t('data')}</p>
        {pairs.map((p, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Input
              aria-label={t('key')}
              className="w-32 flex-1"
              value={p.key}
              placeholder={t('key')}
              onChange={(e) =>
                setPairs(pairs.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
              }
            />
            <select
              aria-label={t('valueType')}
              className={`${fieldClass} w-auto`}
              value={p.type}
              onChange={(e) =>
                setPairs(
                  pairs.map((x, j) => (j === i ? { ...x, type: e.target.value as FieldType } : x)),
                )
              }
            >
              <option value="string">{t('types.string')}</option>
              <option value="number">{t('types.number')}</option>
              <option value="boolean">{t('types.boolean')}</option>
            </select>
            <Input
              aria-label={t('value')}
              className="w-32 flex-1"
              value={p.value}
              placeholder={t('value')}
              onChange={(e) =>
                setPairs(pairs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
              }
            />
            <button
              type="button"
              aria-label={t('removePair')}
              title={t('removePair')}
              className="min-h-11 px-2 text-lg hover:text-quake"
              onClick={() => setPairs(pairs.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-medium text-quake underline"
          onClick={() => setPairs([...pairs, { key: '', type: 'string', value: '' }])}
        >
          {t('addPair')}
        </button>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={sending}
            className={buttonClass('primary', 'min-h-11')}
            onClick={() => void send()}
          >
            {t('sendButton')}
          </button>
          {sendResult ? (
            <span
              role="status"
              className={sendResult.ok ? 'text-sm' : 'text-sm text-red-700 dark:text-red-400'}
            >
              {sendResult.ok ? '✓ ' : ''}
              {sendResult.text}
            </span>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function pairsFor(type: EventType | undefined): Pair[] {
  if (!type || type.fields.length === 0) return [{ key: 'text', type: 'string', value: 'Hello' }];
  return type.fields.map((f) => ({
    key: f.key,
    type: f.type,
    value: f.type === 'number' ? '1' : f.type === 'boolean' ? 'true' : '',
  }));
}
