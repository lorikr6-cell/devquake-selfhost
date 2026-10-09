'use client';

import { useState } from 'react';
import { buttonClass, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { SecretReveal } from './secret-reveal';
import { useAction } from './use-action';
import { ErrorText, Field, Input } from './ui';

/** Creates an API service; afterwards shows its secret key once, then opens it. */
export function NewApp({ atLimit, max }: { atLimit: boolean; max: number }) {
  const t = useT('newApp');
  const { busy, error, act, router } = useAction();
  const [name, setName] = useState('');
  const [created, setCreated] = useState<{ id: number; secret: string } | null>(null);

  if (created) {
    return (
      <SecretReveal secret={created.secret} onDone={() => router.push(`/apps/${created.id}`)} />
    );
  }
  if (atLimit) {
    return <p className="text-sm text-ink/70 dark:text-paper/70">{t('atLimit', { count: max })}</p>;
  }
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void act(
          async () => {
            const result = await callApi<{ id: number; secret: string }>('/apps', 'POST', { name });
            if (result) setCreated(result);
          },
          () => undefined,
        );
      }}
    >
      <Field label={t('name')} className="min-w-56 flex-1">
        <Input
          value={name}
          maxLength={80}
          required
          placeholder={t('placeholder')}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <button type="submit" disabled={busy} className={buttonClass('primary', 'min-h-11')}>
        {busy ? t('creating') : t('create')}
      </button>
      <div className="w-full">
        <ErrorText>{error}</ErrorText>
      </div>
    </form>
  );
}
