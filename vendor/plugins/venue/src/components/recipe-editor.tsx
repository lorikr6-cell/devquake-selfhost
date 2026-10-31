'use client';

import { useEffect, useState } from 'react';
import { Link, useT } from '@devquake/ui';
import { call, errorText } from './client';
import { Status } from './status';

interface Line {
  ingredientId: number;
  qty: string;
}

/**
 * An item's recipe: what one of it uses from the stock (an espresso: 18 g of beans). Each order
 * takes it off; when an ingredient runs short the item is unavailable on its own.
 */
export function RecipeEditor({ itemId }: { itemId: number }) {
  const t = useT('stock');
  const [ingredients, setIngredients] = useState<
    { id: number; name: string; unit: string }[] | null
  >(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  useEffect(() => {
    fetch(`/api/items/${itemId}/recipe`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(
        (d: {
          lines: { ingredientId: number; qty: number }[];
          ingredients: { id: number; name: string; unit: string }[];
        }) => {
          setIngredients(d.ingredients ?? []);
          setLines(
            (d.lines ?? []).map((l) => ({ ingredientId: l.ingredientId, qty: String(l.qty) })),
          );
        },
      )
      .catch(() => setIngredients([]));
  }, [itemId]);

  if (ingredients === null) return <p className="text-sm">…</p>;
  if (!ingredients.length)
    return (
      <p className="text-sm text-ink/60 dark:text-paper/60">
        {t('noIngredients')}{' '}
        <Link href="/stock" className="underline">
          {t('toStock')}
        </Link>
      </p>
    );
  const unitOf = (id: number) => ingredients.find((i) => i.id === id)?.unit ?? 'pcs';

  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="text-sm font-medium">{t('recipe')}</legend>
      {lines.map((l, k) => (
        <div key={k} className="flex flex-wrap items-center gap-2 text-sm">
          <select
            value={l.ingredientId}
            onChange={(e) =>
              setLines((all) =>
                all.map((x, i) => (i === k ? { ...x, ingredientId: Number(e.target.value) } : x)),
              )
            }
            className="rounded-md border border-ink/20 bg-white px-2 py-1 dark:border-paper/20 dark:bg-zinc-900"
          >
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <input
            inputMode="decimal"
            value={l.qty}
            onChange={(e) =>
              setLines((all) => all.map((x, i) => (i === k ? { ...x, qty: e.target.value } : x)))
            }
            aria-label={t('qty')}
            className="w-24 rounded-md border border-ink/20 bg-white px-2 py-1 dark:border-paper/20 dark:bg-zinc-900"
          />
          <span>{t(`units.${unitOf(l.ingredientId)}`)}</span>
          <button
            type="button"
            className="text-red-700 underline dark:text-red-400"
            onClick={() => setLines((all) => all.filter((_, i) => i !== k))}
          >
            {t('remove')}
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          className="underline"
          onClick={() => setLines((all) => [...all, { ingredientId: ingredients[0]!.id, qty: '' }])}
        >
          + {t('addIngredient')}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-md border border-ink/20 px-3 py-1 disabled:opacity-50 dark:border-paper/20"
          onClick={async () => {
            setBusy(true);
            setMessage(null);
            try {
              await call(`/api/items/${itemId}/recipe`, 'PUT', { lines }, t('failed'));
              setMessage({ text: t('recipeSaved'), ok: true });
            } catch (err) {
              setMessage({ text: errorText(err, t('failed')), ok: false });
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('saveRecipe')}
        </button>
        <Status message={message} />
      </div>
    </fieldset>
  );
}
