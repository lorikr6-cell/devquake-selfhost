'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { localizePath, useLocale } from '@devquake/ui';

/** useRouter whose push() keeps the page language ("/lists/4" → "/de/lists/4"). */
export function useAppRouter() {
  const router = useRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      refresh: () => router.refresh(),
      push: (href: string) => router.push(localizePath(href, locale)),
    }),
    [router, locale],
  );
}
