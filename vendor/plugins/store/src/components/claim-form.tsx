'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';

/** The secret code from the email; the server checks it and adds the points (ADR 0079). */
export function ClaimForm({ token }: { token: string }) {
  const t = useT('claims.page');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean; final?: boolean } | null>(
    null,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/claim/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => null)) as {
        message?: string;
        final?: boolean;
      } | null;
      setMessage({ text: data?.message ?? t('failed'), ok: res.ok, final: res.ok || data?.final });
    } catch {
      setMessage({ text: t('failed'), ok: false });
    } finally {
      setBusy(false);
    }
  }

  if (message?.final)
    return (
      <p role={message.ok ? 'status' : 'alert'} className="rounded-md bg-quake/10 p-3 font-medium">
        {message.text}
      </p>
    );
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium">
        {t('codeLabel')}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          className="mt-1 block w-full rounded-md border border-ink/20 bg-white px-3 py-2 font-mono tracking-widest uppercase dark:border-paper/20 dark:bg-zinc-900"
        />
      </label>
      <button
        type="submit"
        disabled={busy || !code.trim()}
        className="rounded-md bg-quake px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {t('submit')}
      </button>
      {message ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
