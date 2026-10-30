import { stripLocale, type Translate } from './i18n';

// The data side of the page tips (page-tips.tsx): usable on the server and in tests.

/** One page's three tips. */
export interface PageTip {
  see: string;
  create: string;
  edit: string;
}

/** A page's tips with the path they belong to ("/r/:id": `:name` is any one segment). */
export interface PageTipsEntry extends PageTip {
  path: string;
  /** A demo page: tips are on here until the visitor turns them off. */
  demo?: boolean;
}

/**
 * The tips for a path: the entry whose pattern matches it with the most fixed segments
 * ("/r/new" before "/r/:id"), or null. The language prefix and a trailing slash are ignored.
 */
export function tipsForPath<T extends { path: string }>(entries: T[], pathname: string): T | null {
  const parts = (stripLocale(pathname).path.replace(/\/+$/, '') || '/').split('/');
  let best: { entry: T; fixed: number } | null = null;
  for (const entry of entries) {
    const pattern = (entry.path.replace(/\/+$/, '') || '/').split('/');
    if (pattern.length !== parts.length) continue;
    let fixed = 0;
    const matches = pattern.every((p, i) => {
      if (p.startsWith(':')) return parts[i] !== '';
      fixed += 1;
      return p === parts[i];
    });
    if (matches && (!best || fixed > best.fixed)) best = { entry, fixed };
  }
  return best?.entry ?? null;
}

/**
 * The tips of an app's pages from its catalog: `pages` maps a path pattern to the key under
 * `tips` ({ '/r/:id': 'recipe' } → tips.recipe.see / .create / .edit); `demo` lists the paths
 * of demo pages, where tips start on.
 */
export function pageTips(
  t: Translate,
  pages: Record<string, string>,
  demo: string[] = [],
): PageTipsEntry[] {
  return Object.entries(pages).map(([path, key]) => ({
    path,
    ...(demo.includes(path) ? { demo: true } : {}),
    see: t(`tips.${key}.see`),
    create: t(`tips.${key}.create`),
    edit: t(`tips.${key}.edit`),
  }));
}
