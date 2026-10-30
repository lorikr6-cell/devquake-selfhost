'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { allergensOf, formatMinor } from '../lib/model';

export interface PublicMenuData {
  name: string;
  currency: string;
  decimals: number;
  categories: { id: number; name: string }[];
  items: {
    id: number;
    categoryId: number;
    name: string;
    description: string | null;
    priceMinor: number;
    allergens: number;
    available: boolean;
  }[];
}

/**
 * The menu for guests, with a search bar (a dish, a drink, a category or an allergen-free
 * choice) and the allergens of every item.
 */
export function MenuBrowser({ menu, intro }: { menu: PublicMenuData; intro?: string }) {
  const t = useT();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const matches = (i: PublicMenuData['items'][number], category: string) =>
    !query ||
    i.name.toLowerCase().includes(query) ||
    (i.description ?? '').toLowerCase().includes(query) ||
    category.toLowerCase().includes(query);

  const sections = menu.categories
    .map((c) => ({
      c,
      items: menu.items.filter((i) => i.categoryId === c.id && matches(i, c.name)),
    }))
    .filter((s) => s.items.length);

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{menu.name}</h1>
        {intro ? <p className="text-ink/70 dark:text-paper/70">{intro}</p> : null}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('publicMenu.search')}
          aria-label={t('publicMenu.search')}
          className="block w-full rounded-full border border-ink/20 bg-white px-4 py-2 dark:border-paper/20 dark:bg-zinc-900"
        />
      </header>
      {sections.length ? (
        sections.map(({ c, items }) => (
          <section key={c.id} className="space-y-3">
            <h2 className="font-display text-xl font-bold">{c.name}</h2>
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className={i.available ? '' : 'opacity-50'}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-medium">{i.name}</span>
                    {i.available ? null : <span className="text-sm">{t('menu.soldOut')}</span>}
                    <span className="ml-auto tabular-nums">
                      {formatMinor(i.priceMinor, menu.decimals)} {menu.currency}
                    </span>
                  </div>
                  {i.description ? (
                    <p className="text-sm text-ink/70 dark:text-paper/70">{i.description}</p>
                  ) : null}
                  {i.allergens ? (
                    <p className="text-xs text-ink/60 dark:text-paper/60">
                      {t('publicMenu.allergens')}{' '}
                      {allergensOf(i.allergens)
                        .map((a) => t(`menu.allergens.${a}`))
                        .join(', ')}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p>{query ? t('publicMenu.noMatch') : t('publicMenu.empty')}</p>
      )}
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('publicMenu.vatNote')}</p>
    </article>
  );
}
