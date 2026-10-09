'use client';

import { useMemo } from 'react';
import { LOCALE_TAGS, useLocale } from '@devquake/ui';
import { formatters } from '../lib/format';

/** Month, day, money and quantity formatters in the page language (client components). */
export function useFormat() {
  const tag = LOCALE_TAGS[useLocale()];
  return useMemo(() => formatters(tag), [tag]);
}
