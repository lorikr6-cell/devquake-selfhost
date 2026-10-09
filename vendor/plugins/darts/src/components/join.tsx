'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import { CODE_PATTERN, cleanCode } from '../lib/model';
import { callApi } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Input } from './ui';
import { useAction } from './use-action';
import { useAppRouter } from './use-app-router';

/** Typing a code someone read out (or from under their QR code). */
export function JoinCodeForm({ label }: { label?: string }) {
  const t = useT('join');
  const router = useAppRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  function go(event: FormEvent) {
    event.preventDefault();
    const clean = cleanCode(code);
    if (!CODE_PATTERN.test(clean)) {
      setError(t('codeInvalid'));
      return;
    }
    router.push(`/join/${clean}`);
  }
  return (
    <form onSubmit={go} className="space-y-2">
      <label className="block text-sm font-medium" htmlFor="join-code">
        {label ?? t('codeLabel')}
      </label>
      <div className="flex gap-2">
        <Input
          id="join-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="ABCD2345"
          className="font-mono tracking-widest"
        />
        <Button type="submit">{t('go')}</Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}

/** Confirms joining the game or tournament behind a code. */
export function JoinButton({ code, label }: { code: string; label: string }) {
  const tToast = useT('toasts');
  const { toast } = useFeedback();
  const { busy, error, act, router } = useAction();
  return (
    <div className="mt-4 space-y-2">
      <Button
        type="button"
        className="min-h-11"
        disabled={busy}
        onClick={() =>
          act(
            async () => {
              const res = await callApi<{ href: string }>('/join', 'POST', { code });
              trackEvent('joined_with_code');
              toast(tToast('joined'));
              router.push(res!.href);
            },
            () => undefined,
          )
        }
      >
        {label}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
