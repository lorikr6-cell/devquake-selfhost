'use client';

import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_NAMES, localizePath, stripLocale, useLocale, useT } from '@devquake/ui';

/**
 * The buyer's language in a shop with its own languages (ADR 0058): the site's languages (the
 * address changes) and the shop's own ones (kept in a cookie for this shop).
 */
export function ShopLanguagePicker({
  storeId,
  current,
  options,
}: {
  storeId: number;
  /** The shop's own language shown now, or null for the site's language. */
  current: string | null;
  options: Array<{ code: string; name: string }>;
}) {
  const t = useT('shop');
  const locale = useLocale();
  const pathname = usePathname() ?? '/';
  const cookie = (value: string) => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `dq_store_lang_${storeId}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  };
  return (
    <label className="inline-flex items-center gap-2">
      <span>{t('language')}</span>
      <select
        value={current ?? `site:${locale}`}
        onChange={(e) => {
          const v = e.target.value;
          if (v.startsWith('site:')) {
            cookie('auto');
            const target = v.slice(5) as (typeof LOCALES)[number];
            window.location.assign(localizePath(stripLocale(pathname).path, target));
          } else {
            cookie(v);
            window.location.reload();
          }
        }}
        className="min-h-9 rounded-md border border-ink/15 bg-white px-2 py-1 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
      >
        {LOCALES.map((l) => (
          <option key={l} value={`site:${l}`}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
