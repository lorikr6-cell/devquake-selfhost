'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { LOCALE_TAGS, useLocale, useT } from '@devquake/ui';
import { approxText } from '../lib/fx';

// Approximate prices in the buyer's currency (ADR 0061), for client components: the shop frame
// provides the chosen currency and its factor; prices add "≈ …" next to the real one.

export interface ShopFx {
  /** The shop's currency (what is charged). */
  base: string;
  /** The currency the buyer sees approximate prices in. */
  code: string;
  /** Units of `code` for one unit of `base`. */
  factor: number;
  /** The ECB rate date (YYYY-MM-DD), if known. */
  date: string | null;
  /** The currencies the buyer can pick. */
  options: string[];
}

const FxContext = createContext<ShopFx | null>(null);

export function FxProvider({ value, children }: { value: ShopFx | null; children: ReactNode }) {
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}

/** "≈ 112,40 lei" for cents in `currency`, when the buyer chose another currency. */
export function useApprox(currency: string) {
  const fx = useContext(FxContext);
  const tag = LOCALE_TAGS[useLocale()];
  return (cents: number) => (fx && fx.base === currency ? approxText(cents, fx, tag) : null);
}

/**
 * The buyer's choice of currency (a cookie for every shop here). `compact`: in the shop's header,
 * before the account and the cart, the label only for screen readers.
 */
export function CurrencyPicker({ compact = false }: { compact?: boolean }) {
  const fx = useContext(FxContext);
  const t = useT('shop');
  if (!fx) return null;
  return (
    <label className="inline-flex items-center gap-2" title={compact ? t('currency') : undefined}>
      <span className={compact ? 'sr-only' : undefined}>{t('currency')}</span>
      <select
        value={fx.code === fx.base ? 'base' : fx.code}
        onChange={(e) => {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `dq_store_currency=${e.target.value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
          window.location.reload();
        }}
        className="min-h-9 rounded-md border border-ink/15 bg-white px-2 py-1 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
      >
        <option value="base">{fx.base}</option>
        {fx.options
          .filter((c) => c !== fx.base)
          .map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
      </select>
    </label>
  );
}

/** Under prices in another currency: what is charged, and where the rates come from. */
export function FxNote({ className }: { className?: string }) {
  const fx = useContext(FxContext);
  const t = useT('shop');
  if (!fx || fx.code === fx.base) return null;
  return (
    <p className={className}>
      {t('fxNote', { currency: fx.code, base: fx.base, date: fx.date ?? '—' })}
    </p>
  );
}
