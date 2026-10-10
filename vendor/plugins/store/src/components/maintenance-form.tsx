'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { ErrorText, Field, TextArea } from './ui';
import { useAction } from './use-action';

/** Maintenance mode: the shop shows a message to buyers and takes no orders meanwhile. */
export function MaintenanceForm({ on, message }: { on: boolean; message: string | null }) {
  const t = useT('maintenance');
  const { busy, error, act } = useAction();
  const [value, setValue] = useState({ on, message: message ?? '' });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void act(() => callApi('/store/maintenance', 'PUT', value), {
          success: value.on ? t('onSaved') : t('offSaved'),
        });
      }}
    >
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.on}
          onChange={(e) => setValue({ ...value, on: e.target.checked })}
          className="mt-1 accent-quake"
        />
        <span>
          <span className="font-medium">{t('toggle')}</span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">{t('toggleHint')}</span>
        </span>
      </label>
      <Field label={t('message')} hint={t('messageHint')}>
        <TextArea
          value={value.message}
          onChange={(e) => setValue({ ...value, message: e.target.value })}
          maxLength={300}
          rows={3}
          placeholder={t('placeholder')}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {t('save')}
      </Button>
    </form>
  );
}
