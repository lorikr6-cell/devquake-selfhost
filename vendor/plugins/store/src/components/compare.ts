'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

// The products a buyer picked to compare, kept in their browser per shop (like the cart). Only
// product addresses (slugs); the comparison page reads everything else from the shop.

export const COMPARE_MAX = 4;
const EVENT = 'dq-store-compare';
const key = (slug: string) => `dq-store-compare:${slug}`;
const memory = new Map<string, string>();
const SLUG = /^[a-z0-9-]{1,80}$/;

function read(slug: string): string {
  try {
    return window.localStorage.getItem(key(slug)) ?? memory.get(slug) ?? '[]';
  } catch {
    return memory.get(slug) ?? '[]';
  }
}

function write(slug: string, list: string[]) {
  const value = JSON.stringify(list);
  memory.set(slug, value);
  try {
    window.localStorage.setItem(key(slug), value);
  } catch {
    // Kept in memory only.
  }
  window.dispatchEvent(new Event(EVENT));
}

function parse(raw: string): string[] {
  try {
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data)
      ? [...new Set(data.filter((x): x is string => typeof x === 'string' && SLUG.test(x)))].slice(
          0,
          COMPARE_MAX,
        )
      : [];
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

export function useCompare(slug: string) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => '',
  );
  const list = useMemo(() => parse(raw || '[]'), [raw]);
  const toggle = useCallback(
    (product: string): 'added' | 'removed' | 'full' => {
      const current = parse(read(slug));
      if (current.includes(product)) {
        write(
          slug,
          current.filter((p) => p !== product),
        );
        return 'removed';
      }
      if (current.length >= COMPARE_MAX) return 'full';
      write(slug, [...current, product]);
      return 'added';
    },
    [slug],
  );
  const set = useCallback((next: string[]) => write(slug, parse(JSON.stringify(next))), [slug]);
  return { ready: raw !== '', list, toggle, set };
}
