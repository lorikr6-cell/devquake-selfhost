'use client';

import { useState } from 'react';
import { buttonClass, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { useAction } from './use-action';
import { CopyField, ErrorText, Input, Toggle } from './ui';

export interface OriginView {
  id: number;
  origin: string;
  verified: boolean;
  recordName: string;
  recordValue: string;
}

/**
 * The websites allowed to use the public key. A new website works once its DNS TXT record
 * proves it belongs to the member; localhost (development) is a switch.
 */
export function OriginsPanel({
  appId,
  origins,
  allowLocalhost,
}: {
  appId: number;
  origins: OriginView[];
  allowLocalhost: boolean;
}) {
  const t = useT('origins');
  const { busy, error, act } = useAction();
  const [origin, setOrigin] = useState('');

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      {origins.length === 0 ? <p className="text-sm">{t('empty')}</p> : null}
      <ul className="space-y-3">
        {origins.map((o) => (
          <li key={o.id} className="rounded-lg border border-ink/10 p-3 dark:border-paper/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm break-all">{o.origin}</span>
              <span
                className={
                  o.verified
                    ? 'rounded-full bg-emerald-600/15 px-2 text-xs text-emerald-800 dark:text-emerald-300'
                    : 'rounded-full bg-amber-500/15 px-2 text-xs'
                }
              >
                {o.verified ? `✓ ${t('verified')}` : t('pending')}
              </span>
              <button
                type="button"
                disabled={busy}
                className="ml-auto text-sm underline hover:text-quake"
                onClick={() => void act(() => callApi(`/apps/${appId}/origins/${o.id}`, 'DELETE'))}
              >
                {t('remove')}
              </button>
            </div>
            {!o.verified ? (
              <div className="mt-3 space-y-2 text-sm">
                <p>{t('recordIntro')}</p>
                <dl className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                  <dt className="font-medium">{t('recordType')}</dt>
                  <dd className="font-mono">TXT</dd>
                  <dt className="font-medium">{t('recordName')}</dt>
                  <dd>
                    <CopyField value={o.recordName} label={t('recordName')} />
                  </dd>
                  <dt className="font-medium">{t('recordValue')}</dt>
                  <dd>
                    <CopyField value={o.recordValue} label={t('recordValue')} />
                  </dd>
                </dl>
                <p className="text-xs text-ink/60 dark:text-paper/60">{t('recordHint')}</p>
                <button
                  type="button"
                  disabled={busy}
                  className={buttonClass('secondary', 'min-h-11')}
                  onClick={() => void act(() => callApi(`/apps/${appId}/origins/${o.id}`, 'POST'))}
                >
                  {busy ? t('checking') : t('check')}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void act(async () => {
            await callApi(`/apps/${appId}/origins`, 'POST', { origin });
            setOrigin('');
          });
        }}
      >
        <label className="block min-w-56 flex-1 text-sm">
          <span className="mb-1 block font-medium">{t('add')}</span>
          <Input
            value={origin}
            required
            placeholder="https://shop.example.com"
            onChange={(e) => setOrigin(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy} className={buttonClass('primary', 'min-h-11')}>
          {t('addButton')}
        </button>
      </form>
      <ErrorText>{error}</ErrorText>
      <Toggle
        label={t('localhost')}
        hint={t('localhostHint')}
        checked={allowLocalhost}
        disabled={busy}
        onChange={(v) => void act(() => callApi(`/apps/${appId}`, 'PATCH', { allowLocalhost: v }))}
      />
    </div>
  );
}
