'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, cn, useT } from '@devquake/ui';
import { describeEvent, timeAgo, type ActivityEvent } from '../lib/events';
import { callApi } from './call-api';

const VISIBLE_POLL_MS = 5000;
const HIDDEN_POLL_MS = 30000;
const TOAST_MS = 6000;
const SEEN_KEY = 'dq.shopping.seenEvent';
const SYSTEM_KEY = 'dq.shopping.systemNotifications';

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // not remembered on this device, that is fine
  }
};

/**
 * In-app notifications: what friends do on shared lists ("Ana picked up Milk"). A bell with the
 * unread count and the latest events, short toasts for new ones and, if the user allows it,
 * system notifications while the app is open in a background tab. Works in any browser without
 * a push service; when the app is closed nothing is shown.
 */
export function NotificationCenter() {
  const t = useT('notifications');
  const tEvent = useT('events');
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [seen, setSeen] = useState(0);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<ActivityEvent[]>([]);
  const [system, setSystem] = useState(false);
  const latest = useRef(0);
  /** Set once the history is loaded; before that nothing counts as "new". */
  const loaded = useRef(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const panel = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  /** Where the popup starts: just under the bell (it is placed on <body>, see below). */
  const [top, setTop] = useState(64);

  const unread = events.filter((e) => e.id > seen).length;

  const showToast = useCallback((fresh: ActivityEvent[]) => {
    setToasts((t) => [...fresh.slice(0, 3), ...t].slice(0, 3));
    for (const e of fresh) {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== e.id)), TOAST_MS);
    }
  }, []);

  // First load: history for the bell, nothing toasted.
  useEffect(() => {
    setSeen(Number(read(SEEN_KEY) ?? 0));
    setSystem(
      read(SYSTEM_KEY) === 'on' &&
        'Notification' in window &&
        Notification.permission === 'granted',
    );
  }, []);

  /** No access to the app (e.g. reading the public manual): stop asking. */
  const denied = useRef(false);

  const loadHistory = useCallback(async () => {
    const res = await callApi<{ events: ActivityEvent[] }>('/events').catch((err: unknown) => {
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) denied.current = true;
      return null;
    });
    if (!res) return;
    setEvents(res.events);
    latest.current = res.events[0]?.id ?? 0;
    loaded.current = true;
  }, []);

  // Then only newer events.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (!loaded.current) {
        await loadHistory();
        if (!stopped && !denied.current) timer = setTimeout(poll, VISIBLE_POLL_MS);
        return;
      }
      const res = await callApi<{ events: ActivityEvent[] }>(
        `/events?after=${latest.current}`,
      ).catch(() => null);
      if (!stopped && res && res.events.length > 0) {
        latest.current = res.events[0]!.id;
        setEvents((old) => [...res.events, ...old].slice(0, 30));
        if (document.visibilityState === 'visible') showToast(res.events);
        else if (system && 'Notification' in window && Notification.permission === 'granted') {
          const first = res.events[0]!;
          const more =
            res.events.length > 1 ? ` ${t('more', { count: res.events.length - 1 })}` : '';
          new Notification(first.listName, {
            body: describeEvent(first, tEvent) + more,
            tag: 'dq-shopping',
            icon: '/favicon.ico',
          });
        }
      }
      if (!stopped) {
        timer = setTimeout(
          poll,
          document.visibilityState === 'visible' ? VISIBLE_POLL_MS : HIDDEN_POLL_MS,
        );
      }
    };
    timer = setTimeout(poll, loaded.current ? VISIBLE_POLL_MS : 0);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [showToast, system, loadHistory, t, tEvent]);

  // Close the panel on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panel.current?.contains(target) || popup.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const place = () => {
      const bell = panel.current?.getBoundingClientRect();
      if (bell) setTop(Math.round(bell.bottom + 8));
    };
    place();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  /** Removes one notification here and on the person's other devices. */
  function dismiss(eventId: number) {
    setEvents((old) => old.filter((e) => e.id !== eventId));
    void callApi(`/events/${eventId}`, 'DELETE').catch(() => undefined);
  }

  /** "Clear all": everything shown so far; newer notifications still arrive. */
  function clearAll() {
    const upTo = Math.max(latest.current, events[0]?.id ?? 0);
    setEvents([]);
    if (upTo > 0) void callApi('/events', 'DELETE', { upTo }).catch(() => undefined);
  }

  function toggle() {
    setOpen((o) => !o);
    const top = events[0]?.id ?? 0;
    if (top > seen) {
      setSeen(top);
      write(SEEN_KEY, String(top));
    }
  }

  async function toggleSystem() {
    if (system) {
      setSystem(false);
      write(SYSTEM_KEY, 'off');
      return;
    }
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    const on = permission === 'granted';
    setSystem(on);
    write(SYSTEM_KEY, on ? 'on' : 'off');
  }

  return (
    <>
      <div ref={panel} className="relative">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={unread ? t('labelNew', { count: unread }) : t('label')}
          className="relative inline-flex size-8 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5 hover:text-quake dark:text-paper/70 dark:hover:bg-paper/10"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unread ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-quake px-1 text-[10px] leading-4 font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </button>
      </div>
      {/* On <body>: the toolbar's backdrop blur would trap fixed elements inside the header.
          Full width on phones, never taller than the screen: the list scrolls inside. */}
      {mounted && open
        ? createPortal(
            <div
              ref={popup}
              role="dialog"
              aria-label={t('title')}
              style={{
                top,
                maxHeight: `calc(100dvh - ${top}px - max(0.5rem, env(safe-area-inset-bottom)))`,
              }}
              className="fixed inset-x-2 z-[60] flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white text-ink shadow-xl sm:right-4 sm:left-auto sm:w-96 dark:border-paper/10 dark:bg-ink dark:text-paper"
            >
              <div className="flex items-center justify-between gap-2 border-b border-ink/10 px-4 py-2 dark:border-paper/10">
                <p className="text-sm font-semibold">{t('title')}</p>
                {events.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-md px-2 py-1 text-xs font-medium text-ink/70 underline hover:text-quake dark:text-paper/70"
                  >
                    {t('clearAll')}
                  </button>
                ) : null}
              </div>
              {events.length === 0 ? (
                <p className="px-4 py-4 text-sm text-ink/60 dark:text-paper/60">{t('none')}</p>
              ) : (
                <ul className="min-h-0 flex-1 divide-y divide-ink/5 overflow-y-auto overscroll-contain dark:divide-paper/10">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className={cn('flex items-stretch', e.id > seen && 'bg-quake/5')}
                    >
                      <Link
                        href={`/lists/${e.listId}`}
                        onClick={() => setOpen(false)}
                        className="block min-w-0 flex-1 px-4 py-2 text-sm hover:bg-ink/5 dark:hover:bg-paper/10"
                      >
                        <span className="block">{describeEvent(e, tEvent)}</span>
                        <span className="block text-xs text-ink/60 dark:text-paper/60">
                          {e.listName} · {timeAgo(e.at, tEvent)}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => dismiss(e.id)}
                        aria-label={t('remove')}
                        title={t('remove')}
                        className="w-11 shrink-0 text-ink/40 hover:bg-ink/5 hover:text-red-700 dark:text-paper/40 dark:hover:bg-paper/10 dark:hover:text-red-400"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <label className="flex items-center gap-2 border-t border-ink/10 px-4 py-2 text-xs dark:border-paper/10">
                <input
                  type="checkbox"
                  className="accent-quake"
                  checked={system}
                  onChange={toggleSystem}
                />
                {t('system')}
              </label>
            </div>,
            document.body,
          )
        : null}
      {/* Toasts, also on <body>. */}
      {mounted
        ? createPortal(
            <div
              aria-live="polite"
              className="fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
            >
              {toasts.map((e) => (
                <Link
                  key={e.id}
                  href={`/lists/${e.listId}`}
                  className="rounded-lg border border-ink/10 border-l-4 border-l-quake bg-white px-4 py-3 text-sm text-ink shadow-lg dark:border-paper/10 dark:bg-ink dark:text-paper"
                >
                  <span className="block font-medium">{describeEvent(e, tEvent)}</span>
                  <span className="block text-xs text-ink/60 dark:text-paper/60">{e.listName}</span>
                </Link>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
