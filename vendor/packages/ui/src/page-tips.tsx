'use client';

import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { cn } from './cn';
import type { Locale } from './i18n';
import { useLocale } from './i18n-react';
import { tipsForPath, type PageTip, type PageTipsEntry } from './page-tips-data';

/**
 * How-to tips on each page (how to see the details, how to add, how to change), floating in a
 * corner, on the site, in the control panel and in every app. `TipsToggle` (the 💡 button in
 * the header) turns them on or off on every page; the choice is kept on this device only
 * (each app's subdomain keeps its own). Off until someone turns them on, except in demo mode
 * (`defaultOn`, or a page marked `demo`), where they are on until someone turns them off.
 */

// The panel's own words, in every language (ADR 0011); the tips come from the app.
const WORDS: Record<
  Locale,
  {
    title: string;
    show: string;
    hide: string;
    see: string;
    create: string;
    edit: string;
    footer: string;
  }
> = {
  en: {
    title: 'How to use this page',
    show: 'Show tips',
    hide: 'Hide tips',
    see: 'See details:',
    create: 'Add:',
    edit: 'Change:',
    footer: 'Turn the tips on or off on every page with “💡” in the header.',
  },
  de: {
    title: 'So nutzt du diese Seite',
    show: 'Tipps zeigen',
    hide: 'Tipps ausblenden',
    see: 'Details ansehen:',
    create: 'Hinzufügen:',
    edit: 'Ändern:',
    footer: 'Schalte die Tipps für alle Seiten mit „💡“ oben ein oder aus.',
  },
  ro: {
    title: 'Cum folosești această pagină',
    show: 'Arată sfaturile',
    hide: 'Ascunde sfaturile',
    see: 'Vezi detaliile:',
    create: 'Adaugă:',
    edit: 'Modifică:',
    footer: 'Pornește sau oprește sfaturile pe toate paginile cu „💡” din antet.',
  },
  hu: {
    title: 'Így használd ezt az oldalt',
    show: 'Tippek mutatása',
    hide: 'Tippek elrejtése',
    see: 'Részletek:',
    create: 'Hozzáadás:',
    edit: 'Módosítás:',
    footer: 'A fejlécben a „💡” gombbal minden oldalon be- vagy kikapcsolhatod a tippeket.',
  },
  it: {
    title: 'Come usare questa pagina',
    show: 'Mostra i suggerimenti',
    hide: 'Nascondi i suggerimenti',
    see: 'Vedere i dettagli:',
    create: 'Aggiungere:',
    edit: 'Modificare:',
    footer: 'Attiva o disattiva i suggerimenti su ogni pagina con «💡» nell’intestazione.',
  },
  es: {
    title: 'Cómo usar esta página',
    show: 'Mostrar consejos',
    hide: 'Ocultar consejos',
    see: 'Ver detalles:',
    create: 'Añadir:',
    edit: 'Cambiar:',
    footer: 'Activa o desactiva los consejos en todas las páginas con «💡» en el encabezado.',
  },
};

const KEY = 'devquake-tips';
const EVENT = 'devquake-tips';

function read(key: string): 'on' | 'off' | null {
  try {
    const v = window.localStorage.getItem(key);
    return v === 'on' || v === 'off' ? v : null;
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

/** Whether tips are on on this device, and the switch. */
export function useTips(
  defaultOn = false,
  storageKey: string = KEY,
): [boolean, (on: boolean) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(storageKey),
    () => null,
  );
  const on = stored === null ? defaultOn : stored === 'on';
  const set = (value: boolean) => {
    try {
      window.localStorage.setItem(storageKey, value ? 'on' : 'off');
    } catch {
      // private window: the switch works until the page is left
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [on, set];
}

/** The 💡 switch in a header: turns the tips on or off on every page. */
export function TipsToggle({
  pages,
  defaultOn,
  storageKey,
  withLabel,
  locale,
  className,
}: {
  /** Every page's tips (as for PageTips), so a demo page starts with tips on here too. */
  pages?: PageTipsEntry[];
  defaultOn?: boolean;
  storageKey?: string;
  /** Show "Show tips" / "Hide tips" next to the bulb (otherwise it is the tooltip). */
  withLabel?: boolean;
  /** The panel's language when it is not the page's (the control panel is English). */
  locale?: Locale;
  className?: string;
}) {
  const pageLocale = useLocale();
  const words = WORDS[locale ?? pageLocale];
  const pathname = usePathname() ?? '/';
  const demo = pages ? tipsForPath(pages, pathname)?.demo : undefined;
  const [on, set] = useTips(defaultOn ?? demo ?? false, storageKey);
  const label = on ? words.hide : words.show;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={withLabel ? undefined : label}
      title={withLabel ? undefined : label}
      onClick={() => set(!on)}
      className={cn(
        withLabel
          ? 'inline-flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-0.5 text-xs hover:border-quake dark:border-paper/20'
          : 'inline-flex size-9 shrink-0 items-center justify-center rounded-md text-base transition focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none',
        !withLabel && (on ? 'bg-amber-400/25' : 'opacity-60 grayscale hover:opacity-100'),
        'print:hidden',
        className,
      )}
    >
      <span aria-hidden>💡</span>
      {withLabel ? label : null}
    </button>
  );
}

/**
 * The current page's tips, floating at the bottom of the screen while tips are on. Give either
 * `tip` (this page's) or `pages` (every page's, picked by the address); nothing shows for a
 * page without tips.
 */
export function PageTips({
  tip,
  pages,
  defaultOn,
  storageKey,
  footer,
  locale,
}: {
  tip?: PageTip;
  pages?: PageTipsEntry[];
  defaultOn?: boolean;
  storageKey?: string;
  /** Replaces the line under the tips (e.g. when they are on by default somewhere). */
  footer?: string;
  locale?: Locale;
}) {
  const pageLocale = useLocale();
  const words = WORDS[locale ?? pageLocale];
  const pathname = usePathname() ?? '/';
  const entry = pages ? tipsForPath(pages, pathname) : null;
  const [on, set] = useTips(defaultOn ?? entry?.demo ?? false, storageKey);
  const current = tip ?? entry;
  if (!on || !current) return null;
  return (
    <aside
      aria-label={words.title}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-amber-400/60 bg-amber-50 p-4 text-sm text-amber-950 shadow-lg print:hidden dark:border-amber-500/40 dark:bg-amber-950 dark:text-amber-50"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">
          <span aria-hidden>💡 </span>
          {words.title}
        </p>
        <button
          type="button"
          onClick={() => set(false)}
          aria-label={words.hide}
          className="-mt-1 rounded px-1 text-lg leading-none hover:bg-amber-200/60 dark:hover:bg-amber-800/60"
        >
          ×
        </button>
      </div>
      <ul className="mt-2 space-y-1.5">
        <li>
          <span className="font-medium">{words.see}</span> {current.see}
        </li>
        <li>
          <span className="font-medium">{words.create}</span> {current.create}
        </li>
        <li>
          <span className="font-medium">{words.edit}</span> {current.edit}
        </li>
      </ul>
      <p className="mt-2 text-xs opacity-80">{footer ?? words.footer}</p>
    </aside>
  );
}
