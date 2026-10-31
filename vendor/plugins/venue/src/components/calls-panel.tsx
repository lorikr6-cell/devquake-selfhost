'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@devquake/ui';
import type { Call } from '../lib/calls';
import { call as api, errorText } from './client';

/** A short "ding" for a new call (no file to load). */
function ding() {
  try {
    const ctx = new AudioContext();
    for (const [f, start] of [
      [880, 0],
      [1320, 0.18],
    ] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.25, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + 0.4);
    }
  } catch {
    // No sound where the browser does not allow it yet.
  }
}

const b64ToBytes = (b64: string) => {
  const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

/** "Notifications on this device": the browser's push for the waiter switched in here. */
export function PushToggle() {
  const t = useT('call');
  const [state, setState] = useState<'unsupported' | 'off' | 'on' | 'denied'>('off');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') setState('denied');
    void navigator.serviceWorker.getRegistration('/').then(async (reg) => {
      if (reg && (await reg.pushManager.getSubscription())) setState('on');
    });
  }, []);
  if (state === 'unsupported')
    return <span className="text-xs opacity-60">{t('pushUnsupported')}</span>;

  async function toggle() {
    setBusy(true);
    setMessage('');
    try {
      const reg = await navigator.serviceWorker.register('/api/push-sw', { scope: '/' });
      const existing = await reg.pushManager.getSubscription();
      if (state === 'on' && existing) {
        await api('/api/floor/push', 'DELETE', { endpoint: existing.endpoint }, t('failed'));
        await existing.unsubscribe();
        setState('off');
        setMessage(t('pushOff'));
        return;
      }
      if ((await Notification.requestPermission()) !== 'granted') {
        setState('denied');
        setMessage(t('pushDenied'));
        return;
      }
      const { publicKey } = (await (await fetch('/api/floor/push')).json()) as {
        publicKey: string;
      };
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToBytes(publicKey),
        }));
      await api('/api/floor/push', 'POST', sub.toJSON(), t('failed'));
      setState('on');
      setMessage(t('pushOn'));
    } catch (err) {
      setMessage(errorText(err, t('failed')));
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        disabled={busy || state === 'denied'}
        onClick={() => void toggle()}
        className="underline disabled:opacity-50"
      >
        {state === 'on' ? `🔔 ${t('pushStop')}` : `🔕 ${t('pushStart')}`}
      </button>
      {message ? <span role="status">{message}</span> : null}
    </span>
  );
}

/**
 * The tables calling now, on the floor: rings once for each new call; "I'm coming" tells the
 * guest, "Done" closes it. `calls` comes from the floor's refresh.
 */
export function CallsPanel({
  calls,
  onChange,
}: {
  calls: Call[];
  onChange: (calls: Call[]) => void;
}) {
  const t = useT('call');
  const seen = useRef<Set<number> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const ids = new Set(calls.map((c) => c.id));
    if (seen.current && calls.some((c) => c.status === 'open' && !seen.current!.has(c.id))) ding();
    seen.current = ids;
  }, [calls]);

  if (!calls.length) return null;
  async function answer(id: number, status: 'coming' | 'done') {
    setError('');
    try {
      const r = await api<{ open: Call[] }>(
        `/api/floor/calls/${id}`,
        'PUT',
        { status },
        t('failed'),
      );
      onChange(r.open);
    } catch (err) {
      setError(errorText(err, t('failed')));
    }
  }
  return (
    <section className="rounded-xl border-2 border-quake bg-quake/5 p-3" aria-live="polite">
      <h2 className="mb-2 font-semibold">🙋 {t('calling', { count: calls.length })}</h2>
      <ul className="space-y-2">
        {calls.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-bold">{c.tableName}</span>
            <span className="text-sm opacity-70">
              {c.status === 'coming' ? t('onTheWay', { name: c.answeredBy ?? '' }) : t('waiting')}
            </span>
            <span className="ml-auto flex gap-2">
              {c.status === 'open' ? (
                <button
                  type="button"
                  onClick={() => void answer(c.id, 'coming')}
                  className="rounded-md bg-quake px-3 py-1 text-sm font-medium text-white"
                >
                  {t('imComing')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void answer(c.id, 'done')}
                className="rounded-md border border-ink/20 px-3 py-1 text-sm dark:border-paper/20"
              >
                {t('done')}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
