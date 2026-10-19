'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { localizePath, stripLocale } from './i18n';
import { useLocale } from './i18n-react';
import { DevQuakeMark } from './logo';

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
    rememberPage();
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

const RETURN_KEY = 'dq_return';

/** DevQuake's root host from this page's (store.devquake.com → devquake.com). */
function rootHost(): string {
  const parts = window.location.hostname.split('.');
  return parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')
    ? parts.slice(1).join('.')
    : window.location.hostname;
}

/** Whether an address is one of DevQuake's (the site or one of its app subdomains). */
function isOurs(url: URL): boolean {
  const root = rootHost();
  return url.hostname === root || url.hostname.endsWith(`.${root}`);
}

const PAGE_COOKIE = 'dq_page';

/**
 * The page in a first-party cookie shared by DevQuake's hosts, so a section on another host (the
 * Store) knows the exact page the visitor came from: browsers pass only the origin to another
 * host (Referrer-Policy strict-origin-when-cross-origin). Never sent anywhere else.
 */
function rememberPage() {
  try {
    const root = rootHost();
    const domain = root.includes('.') && !/^[0-9.]+$/.test(root) ? `; domain=.${root}` : '';
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    const value = encodeURIComponent(window.location.href.slice(0, 500));
    document.cookie = `${PAGE_COOKIE}=${value}; path=/; max-age=1800; samesite=lax${domain}${secure}`;
  } catch {
    // Cookies off: the back link uses the referrer.
  }
}

/** The DevQuake page before this one (from the cookie), or null. */
function previousPage(): URL | null {
  try {
    const raw = document.cookie.split('; ').find((c) => c.startsWith(`${PAGE_COOKIE}=`));
    if (raw) return new URL(decodeURIComponent(raw.slice(PAGE_COOKIE.length + 1)));
  } catch {
    // Unreadable: fall back to the referrer.
  }
  return null;
}

/**
 * "← Back" to the DevQuake page the visitor came from before entering this section (the Store on
 * its subdomain, the blog): shown only when they arrived from one of DevQuake's pages outside the
 * section, never for visitors from a search engine or a direct link. The address is remembered
 * for this tab while they browse the section; following the link forgets it. Compact: "←" and
 * the DevQuake mark, with "Back: devquake.com/…" as tooltip and accessible name, so it fits in a
 * row of buttons (the Store's header, the blog's tabs).
 */
export function ReturnLink({
  label,
  section,
  className,
}: {
  /** "Back" in the page's language; the tooltip adds the page ("Back: devquake.com/blog"). */
  label: string;
  /** Where the section is: its path prefix on this host (e.g. "/blog"), or "" for the whole host. */
  section: string;
  className?: string;
}) {
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    const key = `${RETURN_KEY}:${section}`;
    const inSection = (u: URL) =>
      u.host === window.location.host &&
      (section === '' || stripLocale(u.pathname).path.startsWith(section));
    let remembered: string | null = null;
    try {
      remembered = sessionStorage.getItem(key);
      // Runs before NavTracker (children's effects first), so this tab's visit list and the
      // cookie still name the page before this one. The same host (the blog, reached from the
      // home page without a page load): the visit list, as the browser keeps the referrer of the
      // first page loaded. Another host (the Store): the cookie, trusted only when the browser
      // says we came from DevQuake.
      const top = read().at(-1);
      const previous = top ? new URL(top.u, window.location.origin) : null;
      const referrer = document.referrer ? new URL(document.referrer) : null;
      const cookie = previousPage();
      const from =
        previous && previous.pathname !== window.location.pathname && !inSection(previous)
          ? previous
          : referrer && isOurs(referrer)
            ? cookie && isOurs(cookie)
              ? cookie
              : referrer
            : null;
      if (from && !inSection(from)) {
        remembered = from.toString();
        sessionStorage.setItem(key, remembered);
      }
    } catch {
      // No storage or a strange referrer: no link.
    }
    setTarget(remembered);
  }, [section]);
  if (!target) return null;
  const page = (() => {
    try {
      const u = new URL(target);
      return `${u.host.replace(/^www\./, '')}${u.pathname === '/' ? '' : u.pathname}`;
    } catch {
      return target;
    }
  })();
  const tip = `${label}: ${page}`;
  return (
    <a
      href={target}
      title={tip}
      aria-label={tip}
      onClick={() => {
        try {
          sessionStorage.removeItem(`${RETURN_KEY}:${section}`);
        } catch {
          // The link still works.
        }
      }}
      className={
        className ??
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-ink/20 px-2.5 py-1.5 text-sm text-ink/70 hover:border-quake hover:text-quake dark:border-paper/20 dark:text-paper/70'
      }
    >
      <span aria-hidden>←</span>
      <DevQuakeMark size={18} title="" />
    </a>
  );
}
