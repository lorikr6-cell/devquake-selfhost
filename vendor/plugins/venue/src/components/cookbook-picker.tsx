'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { fieldClass } from './client';

export interface RecipeItem {
  name: string;
  description: string | null;
  allergens: number;
}

/**
 * "Add from your cookbook": search the connected cookbook and pick a recipe; its name,
 * ingredients and allergens fill the new item (the price and VAT stay the owner's).
 */
export function CookbookPicker({ onPick }: { onPick: (item: RecipeItem) => void }) {
  const t = useT('links');
  const [q, setQ] = useState('');
  const [found, setFound] = useState<{ ref: string; title: string; minutes: number }[] | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/links/recipes?q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => null)) as {
        recipes?: { ref: string; title: string; minutes: number }[];
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error || t('failed'));
      setFound(data?.recipes ?? []);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('failed'));
    } finally {
      setBusy(false);
    }
  }

  async function pick(ref: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/links/recipes?ref=${encodeURIComponent(ref)}`, {
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => null)) as {
        item?: RecipeItem;
        error?: string;
      } | null;
      if (!res.ok || !data?.item) throw new Error(data?.error || t('failed'));
      onPick(data.item);
      setFound(null);
      setQ('');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 space-y-2 rounded-lg bg-ink/5 p-3 dark:bg-paper/5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="grow text-sm font-medium">
          📖 {t('fromCookbook')}
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchRecipes')}
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-ink/20 px-3 py-2 text-sm dark:border-paper/20"
        >
          {t('search')}
        </button>
      </form>
      {found ? (
        found.length ? (
          <ul className="flex flex-wrap gap-2">
            {found.map((r) => (
              <li key={r.ref}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void pick(r.ref)}
                  className="rounded-full border border-ink/20 px-3 py-1 text-sm hover:border-quake dark:border-paper/20"
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">{t('noRecipes')}</p>
        )
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
