'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { cn } from './cn';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_NAMES,
  createTranslator,
  localizePath,
  stripLocale,
  type Locale,
  type Messages,
  type Translate,
} from './i18n';

interface I18nValue {
  locale: Locale;
  t: Translate;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: (key) => key,
});

/**
 * Gives client components the page language and a catalog. The host wraps every page in one
 * with its catalog; an app wraps its own pages again with its catalog. The inner one wins, and a
 * key it does not have is looked up in the outer one: host components shown inside an app (the
 * "Back to …" bar) keep their texts.
 */
export function I18nProvider({
  locale,
  messages,
  fallback,
  children,
}: {
  locale: Locale;
  messages: Messages;
  /** English catalog, used for keys a translation lacks. */
  fallback?: Messages;
  children: ReactNode;
}) {
  const outer = useContext(I18nContext).t;
  const value = useMemo(() => {
    const own = createTranslator(locale, messages, fallback);
    // createTranslator answers a missing key with the key itself.
    const t: Translate = (key, params) => {
      const text = own(key, params);
      return text === key ? outer(key, params) : text;
    };
    return { locale, t };
  }, [locale, messages, fallback, outer]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}

/** t('key', params) from the nearest catalog; with `namespace`, keys are relative to it. */
export function useT(namespace?: string): Translate {
  const { t } = useContext(I18nContext);
  return useMemo(
    () => (namespace ? (key, params) => t(`${namespace}.${key}`, params) : t),
    [t, namespace],
  );
}

/**
 * next/link that keeps the page language: root-relative hrefs get the language prefix
 * ("/ideas" → "/de/ideas"). Use it for every internal link outside /admin-cp.
 */
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const target = typeof href === 'string' ? localizePath(href, locale) : href;
  return <NextLink href={target} {...props} />;
}

/**
 * Language picker for the toolbars: plain links to the same page in each language (they work
 * without JavaScript and search engines follow them). The proxy remembers the choice in a
 * cookie; English goes through /en/..., which sets it and redirects to the unprefixed URL.
 */
export function LanguagePicker({
  className,
  label = 'Language',
}: {
  className?: string;
  label?: string;
}) {
  const locale = useLocale();
  const pathname = usePathname() ?? '/';
  const [suffix, setSuffix] = useState('');
  const details = useRef<HTMLDetailsElement>(null);

  // Keep ?query and #hash when switching (read after mount: not known on the server).
  useEffect(() => {
    setSuffix(`${window.location.search}${window.location.hash}`);
  }, [pathname]);

  // Close when clicking elsewhere or pressing Escape.
  useEffect(() => {
    const close = (event: Event) => {
      const el = details.current;
      if (!el?.open) return;
      if (
        event instanceof KeyboardEvent ? event.key === 'Escape' : !el.contains(event.target as Node)
      ) {
        el.open = false;
      }
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  const { path } = stripLocale(pathname);
  const hrefFor = (target: Locale) =>
    `${target === DEFAULT_LOCALE ? (path === '/' ? '/en' : `/en${path}`) : localizePath(path, target)}${suffix}`;

  return (
    <details ref={details} className={cn('relative', className)}>
      <summary
        aria-label={`${label}: ${LOCALE_NAMES[locale]}`}
        className="flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-1 text-sm font-medium uppercase hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-quake dark:hover:bg-paper/10 [&::-webkit-details-marker]:hidden"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
        {locale}
      </summary>
      <ul
        role="list"
        className="absolute right-0 z-50 mt-1 min-w-36 rounded-md border border-ink/10 bg-paper py-1 text-sm shadow-lg dark:border-paper/15 dark:bg-ink"
      >
        {LOCALES.map((l) => (
          <li key={l}>
            <a
              href={hrefFor(l)}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? 'true' : undefined}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-ink/5 dark:hover:bg-paper/10',
                l === locale && 'font-semibold text-quake',
              )}
            >
              {LOCALE_NAMES[l]}
              <span className="text-xs text-ink/50 uppercase dark:text-paper/50">{l}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
