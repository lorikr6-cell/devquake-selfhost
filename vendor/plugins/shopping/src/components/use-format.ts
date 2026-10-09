'use client';

import { useMemo } from 'react';
import { LOCALE_TAGS, useLocale } from '@devquake/ui';
import { formatDay, formatMonth, formatMonthName, weekdayNames, type IsoDate } from '../lib/dates';
import { formatMoney } from '../lib/model';

/** Date and money formatters in the page language. */
export function useFormat() {
  const tag = LOCALE_TAGS[useLocale()];
  return useMemo(
    () => ({
      day: (iso: IsoDate, style?: 'long' | 'short') => formatDay(iso, style, tag),
      month: (iso: IsoDate) => formatMonth(iso, tag),
      monthName: (iso: IsoDate) => formatMonthName(iso, tag),
      money: (amount: number, currency: string) => formatMoney(amount, currency, tag),
      weekdays: weekdayNames(tag),
    }),
    [tag],
  );
}
