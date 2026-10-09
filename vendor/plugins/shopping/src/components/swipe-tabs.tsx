'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@devquake/ui';

export interface SwipeTab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Tabs that can also be swiped on phones and tablets: the panels sit side by side in a
 * horizontal scroll-snap strip. The strip takes the height of the active panel, so a short tab
 * does not leave a long empty page. The active tab is kept in the URL hash (#calendar, ...).
 */
export function SwipeTabs({ tabs, label }: { tabs: SwipeTab[]; label: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const panels = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const go = useCallback((index: number, smooth = true) => {
    const el = strip.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    setActive(index);
  }, []);

  // Open the tab named in the URL hash on load, and when a link changes it (e.g. "#new").
  useEffect(() => {
    const open = (smooth: boolean) => {
      const index = tabs.findIndex((t) => `#${t.id}` === window.location.hash);
      if (index >= 0) go(index, smooth);
    };
    open(false);
    const onHash = () => open(true);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [tabs, go]);

  // Swiping: the panel nearest to the scroll position becomes active.
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const index = Math.round(el.scrollLeft / el.clientWidth);
        setActive((current) => (current === index ? current : index));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Follow the active panel's height (content can change, e.g. a calendar view switch).
  useEffect(() => {
    const panel = panels.current[active];
    if (!panel) return;
    const update = () => setHeight(panel.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    const id = tabs[active]?.id;
    if (id) history.replaceState(null, '', active === 0 ? window.location.pathname : `#${id}`);
  }, [active, tabs]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (active + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    go(next);
    document.getElementById(`tab-${tabs[next]!.id}`)?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="sticky top-[57px] z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-ink/10 bg-paper/95 px-4 backdrop-blur [scrollbar-width:none] sm:mx-0 sm:px-0 dark:border-paper/10 dark:bg-ink/95"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => go(i)}
            className={cn(
              'shrink-0 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              i === active
                ? 'border-quake text-ink dark:text-paper'
                : 'border-transparent text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        ref={strip}
        className="flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height, transition: 'height 150ms ease' }}
      >
        {tabs.map((tab, i) => (
          <div
            key={tab.id}
            ref={(el) => {
              panels.current[i] = el;
            }}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            aria-hidden={i !== active}
            inert={i !== active}
            className="w-full shrink-0 snap-start pt-6"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
