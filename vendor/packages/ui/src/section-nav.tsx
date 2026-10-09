'use client';

import { usePathname } from 'next/navigation';
import { cn } from './cn';
import { stripLocale } from './i18n';
import { Link } from './i18n-react';

export interface SectionNavItem {
  href: string;
  label: string;
  /** Other paths that belong to this section (e.g. "/routines" under the dashboard "/"). */
  also?: string[];
}

const within = (path: string, base: string) =>
  base === '/' ? path === '/' : path === base || path.startsWith(`${base}/`);

/** The section a path belongs to: the longest matching href or `also` prefix wins. */
export function activeSection(items: SectionNavItem[], pathname: string): string | null {
  const path = stripLocale(pathname).path.replace(/\/+$/, '') || '/';
  let best: { href: string; length: number } | null = null;
  for (const item of items) {
    for (const base of [item.href, ...(item.also ?? [])]) {
      if (within(path, base) && (!best || base.length > best.length)) {
        best = { href: item.href, length: base.length };
      }
    }
  }
  return best?.href ?? null;
}

/**
 * An app's sections as tabs under its toolbar (AppToolbar's second row). The current section is
 * underlined in the DevQuake orange and announced as the current page, like the tabs of the
 * shopping app; it scrolls sideways on narrow screens.
 */
export function SectionNav({ items, label }: { items: SectionNavItem[]; label: string }) {
  const current = activeSection(items, usePathname() ?? '/');
  return (
    <nav
      aria-label={label}
      className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-2 text-sm [scrollbar-width:none] sm:px-4"
    >
      {items.map((item) => {
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 font-medium whitespace-nowrap transition-colors',
              active
                ? 'border-quake text-ink dark:text-paper'
                : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
