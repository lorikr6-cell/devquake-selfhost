'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { call, errorText } from './client';

/**
 * The demo venue's buttons (owner's request): try it, open it, go back to the own venue, delete
 * it. `state`: whether a demo exists, whether it is the one shown now, whether an own venue
 * exists. A page reload shows the venue chosen.
 */
export function DemoPanel({
  hasDemo,
  inDemo,
  hasOwn,
  compact = false,
}: {
  hasDemo: boolean;
  inDemo: boolean;
  hasOwn: boolean;
  compact?: boolean;
}) {
  const t = useT('demo');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(method: 'POST' | 'PUT' | 'DELETE', body?: unknown, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError(null);
    try {
      await call(`/api/demo`, method, body, t('failed'));
      window.location.href = '/';
    } catch (err) {
      setError(errorText(err, t('failed')));
      setBusy(false);
    }
  }

  const button =
    'rounded-md border border-ink/20 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-paper/20';
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!hasDemo ? (
        <button type="button" disabled={busy} className={button} onClick={() => void run('POST')}>
          {busy ? t('making') : t('try')}
        </button>
      ) : null}
      {hasDemo && !inDemo ? (
        <button
          type="button"
          disabled={busy}
          className={button}
          onClick={() => void run('PUT', { demo: true })}
        >
          {t('open')}
        </button>
      ) : null}
      {inDemo ? (
        <button
          type="button"
          disabled={busy}
          className={button}
          onClick={() => void run('PUT', { demo: false })}
        >
          {hasOwn ? t('back') : t('setUp')}
        </button>
      ) : null}
      {hasDemo && !compact ? (
        <button
          type="button"
          disabled={busy}
          className="text-sm text-red-700 underline disabled:opacity-50 dark:text-red-400"
          onClick={() => void run('DELETE', undefined, t('deleteConfirm'))}
        >
          {t('delete')}
        </button>
      ) : null}
      {error ? <p className="w-full text-sm text-red-700 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
