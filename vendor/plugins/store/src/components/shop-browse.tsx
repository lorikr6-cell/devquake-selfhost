'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useT } from '@devquake/ui';
import { PRODUCT_SORTS, type ProductSort } from '../lib/model';
import { useAppRouter } from './use-app-router';

/** The shop's order of products (kept in the address, so it can be shared and indexed). */
export function SortSelect({ value }: { value: ProductSort }) {
  const t = useT('shop.sort');
  const router = useAppRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{t('label')}</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === 'position') next.delete('sort');
          else next.set('sort', e.target.value);
          const query = next.toString();
          router.push(`${pathname}${query ? `?${query}` : ''}`);
        }}
        className="min-h-11 rounded-md border border-ink/15 bg-white px-2 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
      >
        {PRODUCT_SORTS.map((s) => (
          <option key={s} value={s}>
            {t(s)}
          </option>
        ))}
      </select>
    </label>
  );
}
