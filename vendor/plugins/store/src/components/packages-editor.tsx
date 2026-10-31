'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';

interface Pkg {
  id: number;
  name: string;
  points: number;
}

/** Adds and removes NPS point packages (ADR 0079); each change says whether it was saved. */
export function PackagesEditor({ initial }: { initial: Pkg[] }) {
  const t = useT('claims.packages');
  const [packages, setPackages] = useState(initial);
  const [name, setName] = useState('');
  const [points, setPoints] = useState('10');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function call(method: 'POST' | 'DELETE', url: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => null)) as {
        packages?: Pkg[];
        error?: string;
      } | null;
      if (!res.ok || !data?.packages) throw new Error(data?.error ?? t('failed'));
      setPackages(data.packages);
      setMessage({ text: t('saved'), ok: true });
      return true;
    } catch (err) {
      setMessage({
        text: err instanceof Error && err.message ? err.message : t('failed'),
        ok: false,
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const field =
    'mt-1 block w-full rounded-md border border-ink/20 bg-white px-3 py-2 dark:border-paper/20 dark:bg-zinc-900';
  return (
    <div className="max-w-xl space-y-4">
      {packages.length ? (
        <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {packages.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-sm text-ink/60 dark:text-paper/60">
                  {p.points} {t('points')}
                </span>
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void call('DELETE', `/api/packages?id=${p.id}`)}
                className="text-sm text-red-700 underline disabled:opacity-50 dark:text-red-400"
              >
                {t('archive')}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/70 dark:text-paper/70">{t('empty')}</p>
      )}
      <form
        className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await call('POST', '/api/packages', { name, points: Number(points) })) setName('');
        }}
      >
        <label className="text-sm">
          {t('name')}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={field}
          />
        </label>
        <label className="text-sm">
          {t('points')}
          <input
            type="number"
            min={1}
            max={100}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
            className={field}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="self-end rounded-md bg-quake px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {t('add')}
        </button>
      </form>
      {message ? (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={message.ok ? 'text-sm' : 'text-sm text-red-700 dark:text-red-400'}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
