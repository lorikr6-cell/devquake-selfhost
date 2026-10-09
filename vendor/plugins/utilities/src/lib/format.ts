import { formatDay, formatMonth, formatMonthShort } from './dates';
import { formatAmount, formatMoney, formatUnitPrice } from './model';

/** Month, day, money and quantity formatters for a BCP 47 tag (LOCALE_TAGS[locale]). */
export function formatters(tag: string) {
  return {
    tag,
    month: (month: string) => formatMonth(month, tag),
    monthShort: (month: string) => formatMonthShort(month, tag),
    day: (day: string) => formatDay(day, tag),
    money: (amount: number, currency: string) => formatMoney(amount, currency, tag),
    amount: (value: number, unit?: string | null) =>
      unit ? `${formatAmount(value, tag)} ${unit}` : formatAmount(value, tag),
    unitPrice: (value: number, currency: string, unit: string | null) =>
      formatUnitPrice(value, currency, unit, tag),
  };
}

export type Formatters = ReturnType<typeof formatters>;
