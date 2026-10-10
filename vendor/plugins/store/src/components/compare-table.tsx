'use client';

import { useEffect, useState } from 'react';
import { Link, cn, useT } from '@devquake/ui';
import { useCompare } from './compare';
import { S } from './shop-style';
import { useAppRouter } from './use-app-router';

export interface CompareColumn {
  slug: string;
  name: string;
  href: string;
  image: string | null;
  price: string;
  was: string | null;
}

export interface CompareRow {
  label: string;
  /** One text per column ('' when the product has none). */
  values: string[];
}

/**
 * The products side by side: a column each, the labels in a first column that stays in view.
 * On phones the columns scroll sideways two at a time (snap). "Only differences" hides rows
 * where every product says the same.
 */
export function CompareTable({
  slug,
  columns,
  rows,
}: {
  slug: string;
  columns: CompareColumn[];
  rows: CompareRow[];
}) {
  const t = useT('compare');
  const router = useAppRouter();
  const { ready, list, set } = useCompare(slug);
  const [differences, setDifferences] = useState(false);

  // An address without products opens the buyer's own selection.
  useEffect(() => {
    if (ready && columns.length === 0 && list.length > 0) {
      router.replace(`/s/${slug}/compare?p=${list.join(',')}`);
    }
  }, [ready, columns.length, list, router, slug]);

  function remove(product: string) {
    const next = list.filter((p) => p !== product);
    set(next);
    const shown = columns.map((c) => c.slug).filter((p) => p !== product);
    router.replace(`/s/${slug}/compare${shown.length ? `?p=${shown.join(',')}` : ''}`);
  }

  if (columns.length === 0) {
    return (
      <div className="space-y-3">
        <p>{t('empty')}</p>
        <Link href={`/s/${slug}`} className={S.button}>
          {t('browse')}
        </Link>
      </div>
    );
  }

  const shownRows = differences
    ? rows.filter((r) => new Set(r.values.map((v) => v.trim().toLowerCase())).size > 1)
    : rows;
  const cell = 'min-w-[44vw] snap-start px-3 py-3 align-top sm:min-w-48';

  return (
    <div className="space-y-3">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={differences}
          onChange={(e) => setDifferences(e.target.checked)}
          className="size-4 [accent-color:var(--shop-accent)]"
        />
        {t('differences')}
      </label>
      <div className={cn('snap-x overflow-x-auto', S.card)}>
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t('title')}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 w-36 min-w-28 px-3 py-3 text-left align-bottom [background-color:var(--shop-page)]"
              >
                <span className="sr-only">{t('feature')}</span>
              </th>
              {columns.map((c) => (
                <th key={c.slug} scope="col" className={cn(cell, 'text-left font-normal')}>
                  <div className="space-y-2">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.image}
                        alt=""
                        className={cn('aspect-square w-full max-w-48 object-cover', S.radius)}
                      />
                    ) : null}
                    <Link
                      href={c.href}
                      className="block font-semibold hover:[color:var(--shop-accent)]"
                    >
                      {c.name}
                    </Link>
                    <p>
                      <span className={cn('font-semibold', c.was && S.accent)}>{c.price}</span>
                      {c.was ? <s className={cn('ml-2 text-xs', S.muted)}>{c.was}</s> : null}
                    </p>
                    <button
                      type="button"
                      className="text-xs underline"
                      onClick={() => remove(c.slug)}
                    >
                      {t('remove')}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shownRows.map((r) => (
              <tr key={r.label} className={cn('border-t', S.line)}>
                <th
                  scope="row"
                  className={cn(
                    'sticky left-0 z-10 px-3 py-3 text-left align-top font-medium [background-color:var(--shop-page)]',
                    S.muted,
                  )}
                >
                  {r.label}
                </th>
                {r.values.map((v, i) => (
                  <td key={columns[i]?.slug ?? i} className={cn(cell, 'whitespace-pre-line')}>
                    {v || <span className={S.muted}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shownRows.length === 0 ? <p className={cn('text-sm', S.muted)}>{t('same')}</p> : null}
    </div>
  );
}
