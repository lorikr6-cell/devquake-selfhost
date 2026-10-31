'use client';

import { useCallback, useState } from 'react';
import { useT } from '@devquake/ui';
import { useVisibleInterval } from './floor-view';

interface CallState {
  status: 'open' | 'coming' | 'done';
  at: string;
  by: string | null;
}

/**
 * "Call the waiter" for guests at a table (raising a hand): the table's waiter is told at once;
 * the guest sees that they were called and when someone is on the way.
 */
export function GuestCall({
  code,
  waiterName,
  initial,
}: {
  code: string;
  waiterName: string | null;
  initial: CallState | null;
}) {
  const t = useT('call');
  const [call, setCall] = useState<CallState | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = call && call.status !== 'done';

  const refresh = useCallback(async () => {
    if (!active) return;
    const res = await fetch(`/api/guest-call/${code}`, { cache: 'no-store' }).catch(() => null);
    if (res?.ok) setCall(((await res.json()) as { call: CallState | null }).call);
  }, [active, code]);
  useVisibleInterval(refresh, 15_000);

  async function raise() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/guest-call/${code}`, { method: 'POST' });
      const data = (await res.json().catch(() => null)) as {
        call?: CallState;
        error?: string;
      } | null;
      if (!res.ok || !data?.call) throw new Error(data?.error || t('failed'));
      setCall(data.call);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="sticky bottom-4 z-10 mx-auto mb-6 max-w-md rounded-2xl border border-quake/30 bg-white/95 p-4 text-center shadow-lg dark:bg-zinc-900/95">
      {waiterName ? <p className="text-sm">{t('yourWaiter', { name: waiterName })}</p> : null}
      {active ? (
        <p className="py-2 text-lg font-medium" role="status">
          {call!.status === 'coming'
            ? `🏃 ${t('coming', { name: call!.by ?? waiterName ?? '' })}`
            : `🙋 ${t('called')}`}
        </p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void raise()}
          className="mt-1 w-full rounded-full bg-quake px-5 py-3 text-lg font-semibold text-white shadow disabled:opacity-50"
        >
          🙋 {t('button')}
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
