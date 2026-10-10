'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { LIMITS, type CartLine } from '../lib/model';

// The cart lives in the buyer's browser (ADR 0057: buyers never sign in), one per shop. Checkout
// checks every line against the database, so nothing here is trusted. Storage may be blocked
// (private windows); the cart then lasts as long as the page.

const EVENT = 'dq-store-cart';
const key = (slug: string) => `dq-store-cart:${slug}`;
const memory = new Map<string, string>();

function read(slug: string): string {
  try {
    return window.localStorage.getItem(key(slug)) ?? memory.get(slug) ?? '[]';
  } catch {
    return memory.get(slug) ?? '[]';
  }
}

function write(slug: string, lines: CartLine[]) {
  const value = JSON.stringify(lines);
  memory.set(slug, value);
  try {
    window.localStorage.setItem(key(slug), value);
  } catch {
    // Kept in memory only.
  }
  window.dispatchEvent(new Event(EVENT));
}

function parse(raw: string): CartLine[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map((l) => ({ variantId: Number(l?.variantId), quantity: Number(l?.quantity) }))
      .filter(
        (l) =>
          Number.isSafeInteger(l.variantId) &&
          l.variantId > 0 &&
          Number.isInteger(l.quantity) &&
          l.quantity > 0,
      )
      .slice(0, LIMITS.cartLines);
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** The shop's cart and ways to change it; `ready` is false until the browser's copy is read. */
export function useCart(slug: string) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => '',
  );
  const lines = useMemo(() => parse(raw || '[]'), [raw]);

  const add = useCallback(
    (variantId: number, quantity: number) => {
      const current = parse(read(slug));
      const found = current.find((l) => l.variantId === variantId);
      const next = found
        ? current.map((l) =>
            l.variantId === variantId
              ? { ...l, quantity: Math.min(LIMITS.quantity, l.quantity + quantity) }
              : l,
          )
        : [...current, { variantId, quantity: Math.min(LIMITS.quantity, quantity) }];
      write(slug, next.slice(0, LIMITS.cartLines));
    },
    [slug],
  );

  const setQuantity = useCallback(
    (variantId: number, quantity: number) => {
      const current = parse(read(slug));
      write(
        slug,
        quantity <= 0
          ? current.filter((l) => l.variantId !== variantId)
          : current.map((l) =>
              l.variantId === variantId
                ? { ...l, quantity: Math.min(LIMITS.quantity, quantity) }
                : l,
            ),
      );
    },
    [slug],
  );

  const clear = useCallback(() => write(slug, []), [slug]);

  return {
    ready: raw !== '',
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    add,
    setQuantity,
    clear,
  };
}

/** What the shop's cart API answers for each line (GET /api/s/:slug/cart). */
export interface CartItem {
  variantId: number;
  productId: number;
  name: string;
  slug: string;
  optionName: string;
  available: boolean;
  cents: number;
  regularCents: number;
  onSale: boolean;
  stock: number | null;
  photoId: number | null;
}
