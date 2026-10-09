'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { Locale } from './i18n';
import { LOCALE_TAGS } from './i18n';
import { useLocale } from './i18n-react';
import { Sheet } from './sheet';
import { buttonClass } from './button';

/** One notification as the host's notification routes return it (ADR 0036). */
export interface NotificationBellItem {
  id: number;
  app: string | null;
  appName?: string | null;
  appIcon?: string | null;
  title: string;
  body: string | null;
  url: string | null;
  /** UTC ISO. */
  createdAt: string;
  read: boolean;
}

const WORDS: Record<
  Locale,
  {
    open: string;
    title: string;
    empty: string;
    close: string;
    fresh: string;
    unread: (n: number) => string;
  }
> = {
  en: {
    open: 'Notifications',
    title: 'Notifications',
    empty: 'Nothing new. Reminders of upcoming events show here.',
    close: 'Close',
    fresh: 'new',
    unread: (n) => `${n} new`,
  },
  de: {
    open: 'Benachrichtigungen',
    title: 'Benachrichtigungen',
    empty: 'Nichts Neues. Erinnerungen an kommende Termine erscheinen hier.',
    close: 'Schließen',
    fresh: 'neu',
    unread: (n) => `${n} neu`,
  },
  ro: {
    open: 'Notificări',
    title: 'Notificări',
    empty: 'Nimic nou. Mementourile pentru evenimentele care urmează apar aici.',
    close: 'Închide',
    fresh: 'nou',
    unread: (n) => `${n} noi`,
  },
  hu: {
    open: 'Értesítések',
    title: 'Értesítések',
    empty: 'Nincs újdonság. A közelgő események emlékeztetői itt jelennek meg.',
    close: 'Bezárás',
    fresh: 'új',
    unread: (n) => `${n} új`,
  },
};

/** From this width the list opens under the bell; below it, centred as a sheet. */
const WIDE = '(min-width: 1024px)';

/** Checks again at most this often (on focus). */
const REFRESH_MS = 60_000;

/**
 * The bell with the member's notifications (ADR 0036), as a list under the bell on wide screens
 * and a centred sheet on phones and tablets: reminders of upcoming events that their
 * apps also email. `endpoint` is the host route: "/api/_notifications" in an app (that app's
 * only), "/api/notifications" on devquake.com (all, with the app's name). Opening marks them
 * read. Times are shown in the browser's time zone. With `hideWhenEmpty` it renders nothing
 * until there is a notification.
 */
export function NotificationBell({
  endpoint,
  hideWhenEmpty = false,
  showApp = false,
}: {
  endpoint: string;
  hideWhenEmpty?: boolean;
  showApp?: boolean;
}) {
  const locale = useLocale();
  const w = WORDS[locale] ?? WORDS.en;
  const titleId = useId();
  const [items, setItems] = useState<NotificationBellItem[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [place, setPlace] = useState<CSSProperties>({});
  const bell = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia(WIDE);
    const update = () => setWide(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // On wide screens the list hangs under the bell, its right edge on the bell's right edge. It
  // is rendered at the end of <body> with a fixed position (blurred toolbars would cut it off),
  // so it follows the bell when the page scrolls or resizes, and a click outside or Esc closes it.
  useEffect(() => {
    if (!open || !wide) return;
    const follow = () => {
      const r = bell.current?.getBoundingClientRect();
      if (!r) return;
      // Never wider or taller than the window: 8 px from each edge, the list scrolls inside.
      const width = Math.min(384, window.innerWidth - 16);
      const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
      const top = Math.min(r.bottom + 8, window.innerHeight - 160);
      setPlace({ top, left, width, maxHeight: window.innerHeight - top - 8 });
    };
    follow();
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panel.current?.contains(target) || bell.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      bell.current?.focus();
    };
    window.addEventListener('resize', follow);
    window.addEventListener('scroll', follow, true);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', follow);
      window.removeEventListener('scroll', follow, true);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, wide]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: NotificationBellItem[]; unread?: number };
      setItems(Array.isArray(data.items) ? data.items : []);
      setUnread(Number(data.unread) || 0);
    } catch {
      // offline: keep what is shown
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
    let last = Date.now();
    const onFocus = () => {
      if (Date.now() - last < REFRESH_MS) return;
      last = Date.now();
      void load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const show = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (unread > 0) {
      setUnread(0);
      void fetch(endpoint, { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    }
  };

  if (items === null || (hideWhenEmpty && items.length === 0)) return null;
  const when = (iso: string) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[locale] ?? 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  const heading = (
    <h2 id={titleId} className="font-display text-xl font-bold">
      {w.title}
    </h2>
  );
  const closeButton = (
    <div className="flex justify-end">
      <button type="button" onClick={() => setOpen(false)} className={buttonClass('secondary')}>
        {w.close}
      </button>
    </div>
  );

  const list = (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-ink/70 dark:text-paper/70">{w.empty}</p>
      ) : (
        <ul className="divide-y divide-ink/10 dark:divide-paper/10">
          {items.map((n) => {
            const body = (
              <>
                <span className="flex items-center gap-2 text-xs text-ink/60 dark:text-paper/60">
                  {showApp && n.appIcon ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the app's logo
                    <img src={n.appIcon} alt="" className="size-4 rounded" />
                  ) : null}
                  {showApp && n.appName ? <span>{n.appName}</span> : null}
                  <time dateTime={n.createdAt}>{when(n.createdAt)}</time>
                  {!n.read ? (
                    <span className="rounded-full bg-quake/15 px-1.5 font-semibold text-quake">
                      {w.fresh}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block font-medium">{n.title}</span>
                {n.body ? (
                  <span className="block text-sm text-ink/70 dark:text-paper/70">{n.body}</span>
                ) : null}
              </>
            );
            return (
              <li key={n.id} className="py-3">
                {n.url ? (
                  <a href={n.url} className="block rounded-md hover:text-quake">
                    {body}
                  </a>
                ) : (
                  <div>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={bell}
        type="button"
        onClick={show}
        aria-expanded={open}
        aria-label={unread > 0 ? `${w.open} (${w.unread(unread)})` : w.open}
        title={w.open}
        className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-md text-ink/70 hover:bg-ink/5 hover:text-quake dark:text-paper/70 dark:hover:bg-paper/10"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-quake px-1 text-center text-[10px] leading-4 font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open && wide
        ? createPortal(
            <div
              ref={panel}
              role="dialog"
              aria-labelledby={titleId}
              style={place}
              className="fixed z-[100] flex flex-col overflow-hidden rounded-2xl bg-paper p-4 text-ink shadow-xl ring-1 ring-ink/10 dark:bg-ink dark:text-paper dark:ring-paper/15"
            >
              <div className="shrink-0 pb-2">{heading}</div>
              <div className="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
                {list}
              </div>
            </div>,
            document.body,
          )
        : null}
      <Sheet
        open={open && !wide}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        header={heading}
        footer={closeButton}
      >
        {list}
      </Sheet>
    </>
  );
}
