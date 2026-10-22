'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { ErrorText, Field, Input } from './ui';
import { useAction } from './use-action';

/**
 * Organisers: delete the organisation with everything in it. Nothing can bring it back, so the
 * button only works once the organisation's name is typed exactly.
 */
export function DeleteOrg({ org }: { org: { id: number; name: string } }) {
  const t = useT('deleteOrg');
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const { busy, error, act, router } = useAction();
  const matches = typed.trim() === org.name.trim();

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-red-700 dark:text-red-400"
        onClick={() => setOpen(true)}
      >
        {t('open')}
      </Button>
    );
  }
  return (
    <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
      <p className="font-semibold">{t('title', { name: org.name })}</p>
      <p className="mt-1">{t('body')}</p>
      <Field label={t('typeName', { name: org.name })} className="mt-3">
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!matches || busy}
          className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:text-white"
          onClick={() =>
            act(() => callApi(`/orgs/${org.id}`, 'DELETE', { name: typed }), {
              success: t('deleted', { name: org.name }),
              after: () => router.push('/'),
            })
          }
        >
          {t('confirm')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setTyped('');
          }}
        >
          {t('cancel')}
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
