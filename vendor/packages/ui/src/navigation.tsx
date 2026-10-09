'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { localizePath } from './i18n';
import { useLocale } from './i18n-react';

// "Back" that really goes back (ADR 0039): every page visit in this tab and site is remembered
// in sessionStorage with its full address (filters in the query string) and how far it was
// scrolled. A BackLink returns to the page the person came from, at that address and scroll
// position; only when there is no such page (opened from a bookmark, another site or another
// app) does it follow its href. It navigates to the remembered address rather than calling
// history.back(): the browser's history also holds pages the person went forward to.

const KEY = 'dq_nav';
const RESTORE_KEY = 'dq_nav_restore';
const MAX = 30;

interface Visit {
  /** Path and query string. */
  u: string;
  /** Scroll position (px). */
  y: number;
}

const here = () => `${window.location.pathname}${window.location.search}`;
const pathOf = (u: string) => u.split('?')[0];

function read(): Visit[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(value)
      ? value.filter((v): v is Visit => typeof v?.u === 'string' && typeof v?.y === 'number')
      : [];
  } catch {
    return [];
  }
}

function write(stack: Visit[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-MAX)));
  } catch {
    // Private mode or full storage: back links use their href.
  }
}

/** Remembers the current page's address (with its filters) and scroll position. */
function remember() {
  const stack = read();
  const top = stack[stack.length - 1];
  if (top && pathOf(top.u) === window.location.pathname) {
    top.u = here();
    top.y = Math.round(window.scrollY);
    write(stack);
  }
}

/**
 * Keeps the visit list of this tab (mounted once, in the root layout). New page: added; the
 * page before it again: the last one is dropped (that was a "back"); same page with other
 * filters: updated.
 */
export function NavTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const stack = read();
    const current = here();
    const top = stack[stack.length - 1];
    const before = stack[stack.length - 2];
    if (before && pathOf(before.u) === window.location.pathname) {
      stack.pop();
      before.u = current;
    } else if (top && pathOf(top.u) === window.location.pathname) {
      top.u = current;
    } else {
      stack.push({ u: current, y: 0 });
    }
    write(stack);

    // Arrived through a BackLink: scroll to where the page was left (after it has rendered).
    let restore: number | null = null;
    try {
      const value = sessionStorage.getItem(RESTORE_KEY);
      sessionStorage.removeItem(RESTORE_KEY);
      restore = value === null ? null : Number(value);
    } catch {
      restore = null;
    }
    if (restore !== null && Number.isFinite(restore) && restore > 0) {
      const y = restore;
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
    }
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        remember();
      }, 200);
    };
    // Before following any link: the filters and scroll position of the page being left.
    const onClick = (event: Event) => {
      if ((event.target as Element | null)?.closest?.('a[href]')) remember();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick, true);
    window.addEventListener('pagehide', remember);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('pagehide', remember);
    };
  }, []);

  return null;
}

/**
 * A "← Back" link: to the page the person came from in this site (with its filters and scroll
 * position), or to `href` when they did not come from one. `href` is root-relative and gets the
 * page language like Link.
 */
export function BackLink({
  href,
  localize = true,
  className,
  children,
}: {
  href: string;
  /** false for pages without language prefixes (/admin-cp). */
  localize?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const locale = useLocale();
  const router = useRouter();
  const fallback = localize ? localizePath(href, locale) : href;
  const [previous, setPrevious] = useState<Visit | null>(null);

  useEffect(() => {
    const stack = read();
    const before = stack[stack.length - 2];
    setPrevious(before && pathOf(before.u) !== window.location.pathname ? before : null);
  }, []);

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!previous || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    remember();
    try {
      sessionStorage.setItem(RESTORE_KEY, String(previous.y));
    } catch {
      // the browser restores the position itself in most cases
    }
    router.push(previous.u, { scroll: false });
  }

  return (
    <a href={previous?.u ?? fallback} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
