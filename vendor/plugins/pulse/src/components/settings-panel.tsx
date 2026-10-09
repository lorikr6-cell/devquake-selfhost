'use client';

import { useState } from 'react';
import { buttonClass, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { useAction } from './use-action';
import { ErrorText, Field, Input, TextArea, Toggle } from './ui';

export interface SettingsView {
  name: string;
  browserPublish: boolean;
  strictSchema: boolean;
  paused: boolean;
  serverIps: string;
}

/** Name, who may send, strictness, server addresses, pause and delete. */
export function SettingsPanel({ appId, settings }: { appId: number; settings: SettingsView }) {
  const t = useT('settings');
  const { busy, error, act, router } = useAction();
  const [name, setName] = useState(settings.name);
  const [ips, setIps] = useState(settings.serverIps);
  const [confirm, setConfirm] = useState('');
  const patch = (body: Record<string, unknown>) =>
    act(() => callApi(`/apps/${appId}`, 'PATCH', body));

  return (
    <div className="space-y-5">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void patch({ name });
        }}
      >
        <Field label={t('name')} className="min-w-56 flex-1">
          <Input value={name} maxLength={80} required onChange={(e) => setName(e.target.value)} />
        </Field>
        <button type="submit" disabled={busy} className={buttonClass('secondary', 'min-h-11')}>
          {t('save')}
        </button>
      </form>

      <Toggle
        label={t('browserPublish')}
        hint={t('browserPublishHint')}
        checked={settings.browserPublish}
        disabled={busy}
        onChange={(v) => void patch({ browserPublish: v })}
      />
      <Toggle
        label={t('strict')}
        hint={t('strictHint')}
        checked={settings.strictSchema}
        disabled={busy}
        onChange={(v) => void patch({ strictSchema: v })}
      />
      <Toggle
        label={t('paused')}
        hint={t('pausedHint')}
        checked={settings.paused}
        disabled={busy}
        onChange={(v) => void patch({ paused: v })}
      />

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void patch({ serverIps: ips });
        }}
      >
        <Field label={t('serverIps')} hint={t('serverIpsHint')}>
          <TextArea
            value={ips}
            placeholder="203.0.113.10"
            onChange={(e) => setIps(e.target.value)}
          />
        </Field>
        <button type="submit" disabled={busy} className={buttonClass('secondary', 'min-h-11')}>
          {t('save')}
        </button>
      </form>

      <ErrorText>{error}</ErrorText>

      <div className="space-y-2 rounded-lg border border-red-600/30 p-4">
        <p className="font-semibold">{t('deleteTitle')}</p>
        <p className="text-sm">{t('deleteBody')}</p>
        <Field label={t('deleteConfirm', { name: settings.name })}>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button
          type="button"
          disabled={busy || confirm.trim() !== settings.name}
          className={buttonClass('secondary', 'min-h-11 text-red-700 dark:text-red-400')}
          onClick={() =>
            void act(
              () => callApi(`/apps/${appId}`, 'DELETE'),
              () => router.push('/'),
            )
          }
        >
          {t('deleteButton')}
        </button>
      </div>
    </div>
  );
}
