'use client';

import { useState, type FormEvent } from 'react';
import { Button, Link, cn, useT } from '@devquake/ui';
import { callApi } from './call-api';
import { Input, Select } from './ui';
import { useAction } from './use-action';

export interface ProductRow {
  id: number;
  name: string;
  photoId: number | null;
  published: boolean;
  meta: string;
  stock: number | null;
  price: string;
  onSale: boolean;
  rating: string | null;
}

/** The owner's product list with its filters, selection and bulk actions. */
export function ProductList({
  items,
  filter,
  types,
  vendors,
}: {
  items: ProductRow[];
  filter: { q: string; type: string; vendor: string; status: string };
  types: Array<{ id: number; name: string }>;
  vendors: Array<{ id: number; name: string }>;
}) {
  const t = useT('products');
  const { busy, act, router, confirm } = useAction();
  const [f, setF] = useState(filter);
  const [selected, setSelected] = useState<number[]>([]);
  const all = items.length > 0 && selected.length === items.length;

  function apply(event?: FormEvent, next = f) {
    event?.preventDefault();
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const query = params.toString();
    setSelected([]);
    router.push(`/products${query ? `?${query}` : ''}`);
  }

  async function bulk(action: 'publish' | 'unpublish' | 'delete') {
    if (action === 'delete') {
      const ok = await confirm({
        title: t('bulkDeleteTitle', { count: selected.length }),
        body: t('bulkDeleteBody'),
        confirmLabel: t('bulkDelete'),
        danger: true,
      });
      if (!ok) return;
    }
    await act(() => callApi('/products/bulk', 'POST', { ids: selected, action }), {
      success: t(`bulkDone.${action}`, { count: selected.length }),
    });
    setSelected([]);
  }

  async function duplicate(id: number) {
    await act(
      async () => {
        const res = await callApi<{ id: number }>(`/products/${id}/duplicate`, 'POST');
        router.push(`/products/${res!.id}`);
      },
      { success: t('duplicated'), after: () => undefined },
    );
  }

  const set = (k: keyof typeof f) => (value: string) => {
    const next = { ...f, [k]: value };
    setF(next);
    if (k !== 'q') apply(undefined, next);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={apply} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <label className="sr-only" htmlFor="product-search">
          {t('search')}
        </label>
        <Input
          id="product-search"
          type="search"
          value={f.q}
          onChange={(e) => setF({ ...f, q: e.target.value })}
          placeholder={t('searchPlaceholder')}
          maxLength={80}
        />
        <Select
          aria-label={t('filterType')}
          value={f.type}
          onChange={(e) => set('type')(e.target.value)}
        >
          <option value="">{t('allTypes')}</option>
          {types.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('filterVendor')}
          value={f.vendor}
          onChange={(e) => set('vendor')(e.target.value)}
        >
          <option value="">{t('allVendors')}</option>
          {vendors.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('filterStatus')}
          value={f.status}
          onChange={(e) => set('status')(e.target.value)}
        >
          <option value="">{t('allStatus')}</option>
          <option value="published">{t('statusPublished')}</option>
          <option value="draft">{t('statusDraft')}</option>
        </Select>
        <Button type="submit" variant="secondary">
          {t('searchButton')}
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">
          {Object.values(filter).some(Boolean) ? t('noMatch') : t('empty')}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={all}
                onChange={(e) => setSelected(e.target.checked ? items.map((p) => p.id) : [])}
                className="size-4 accent-quake"
              />
              {t('selectAll', { count: items.length })}
            </label>
            {selected.length > 0 ? (
              <>
                <span className="text-ink/60 dark:text-paper/60">
                  {t('selected', { count: selected.length })}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => bulk('publish')}
                >
                  {t('bulkPublish')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => bulk('unpublish')}
                >
                  {t('bulkUnpublish')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => bulk('delete')}
                >
                  {t('bulkDelete')}
                </Button>
              </>
            ) : null}
          </div>
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
            {items.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  aria-label={t('select', { name: p.name })}
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected((s) =>
                      e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id),
                    )
                  }
                  className="size-4 shrink-0 accent-quake"
                />
                <Link href={`/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {p.photoId !== null ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/products/${p.id}/photos/${p.photoId}?size=thumb&v=${p.photoId}`}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-14 shrink-0 place-items-center rounded-lg bg-ink/5 text-2xl dark:bg-paper/5"
                    >
                      🛍️
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium hover:text-quake">{p.name}</span>
                    <span className="block truncate text-xs text-ink/60 dark:text-paper/60">
                      {[
                        p.meta,
                        !p.published ? t('draft') : null,
                        p.stock === null
                          ? null
                          : p.stock === 0
                            ? t('soldOut')
                            : t('stock', { count: p.stock }),
                        p.rating,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className={cn('shrink-0 font-semibold', p.onSale && 'text-quake')}>
                    {p.price}
                  </span>
                </Link>
                <button
                  type="button"
                  className="shrink-0 rounded-md px-2 py-2 text-xs underline hover:text-quake"
                  disabled={busy}
                  onClick={() => duplicate(p.id)}
                >
                  {t('duplicate')}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
