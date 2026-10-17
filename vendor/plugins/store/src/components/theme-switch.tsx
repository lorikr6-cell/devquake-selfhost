'use client';

import { useState } from 'react';
import { cn, useT } from '@devquake/ui';

// The theme switch in the shop's header (shops without their own design): Adaptive (follows the
// device), Light or Dark, as on DevQuake. Saved in DevQuake's own theme cookie for the whole
// domain, which the server reads, so the choice carries over to devquake.com and its apps.

export type ShopTheme = 'adaptive' | 'light' | 'dark';
const COOKIE = 'dq_theme';

const ICONS: Record<ShopTheme, React.ReactNode> = {
  adaptive: (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5Z" fill="currentColor" />
    </svg>
  ),
  light: (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path d="M13.5 9.5A5.75 5.75 0 0 1 6.5 2.5a5.75 5.75 0 1 0 7 7Z" fill="currentColor" />
    </svg>
  ),
};

/** ".devquake.com" for store.devquake.com; none on localhost or an IP address. */
function cookieDomain(): string {
  const host = window.location.hostname;
  if (host === 'localhost' || /^[\d.]+$/.test(host) || host.includes(':')) return '';
  const parts = host.split('.');
  return parts.length > 2 ? `; domain=.${parts.slice(-2).join('.')}` : '';
}

export function ThemeSwitch({ initial }: { initial: ShopTheme }) {
  const t = useT('shop.theme');
  const [theme, setTheme] = useState<ShopTheme>(initial);

  function choose(value: ShopTheme) {
    setTheme(value);
    const root = document.documentElement;
    root.removeAttribute('data-custom-theme');
    if (value === 'adaptive') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', value);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      value === 'adaptive'
        ? `${COOKIE}=; Max-Age=0; path=/${cookieDomain()}${secure}; SameSite=Lax`
        : `${COOKIE}=${value}; Max-Age=31536000; path=/${cookieDomain()}${secure}; SameSite=Lax`;
  }

  return (
    <fieldset className="inline-flex items-center rounded-full border border-ink/15 p-0.5 dark:border-paper/20">
      <legend className="sr-only">{t('label')}</legend>
      {(['adaptive', 'light', 'dark'] as const).map((value) => (
        <label
          key={value}
          title={t(value)}
          className={cn(
            'inline-flex min-h-8 cursor-pointer items-center rounded-full px-2 py-1 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-quake',
            theme === value
              ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
              : 'text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper',
          )}
        >
          <input
            type="radio"
            name="dq-shop-theme"
            value={value}
            checked={theme === value}
            onChange={() => choose(value)}
            className="sr-only"
          />
          {ICONS[value]}
          <span className="sr-only">{t(value)}</span>
        </label>
      ))}
    </fieldset>
  );
}
