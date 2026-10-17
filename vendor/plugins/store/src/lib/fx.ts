import type { Locale } from '@devquake/ui';
import { formatCents } from './pricing';

// Approximate prices in the buyer's currency (ADR 0061): the European Central Bank's daily
// reference rates (euros per currency), only for showing; orders and payments stay in the shop's
// currency. Pure, so it is fully tested; also used by client components.

/** Currencies a buyer can see prices in (all in the ECB's daily list, plus the euro). */
export const SHOWN_CURRENCIES = ['EUR', 'RON', 'HUF', 'USD', 'GBP', 'CHF', 'PLN', 'CZK'] as const;
export type ShownCurrency = (typeof SHOWN_CURRENCIES)[number];
export const isShownCurrency = (v: unknown): v is ShownCurrency =>
  typeof v === 'string' && (SHOWN_CURRENCIES as readonly string[]).includes(v);

/** Units of each currency for one euro. */
export type Rates = Record<string, number>;

/** The rates in the ECB's daily XML (`<Cube currency='USD' rate='1.0812'/>`), with EUR = 1. */
export function parseEcbRates(xml: string): Rates | null {
  const rates: Rates = { EUR: 1 };
  for (const m of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)) {
    const rate = Number(m[2]);
    if (Number.isFinite(rate) && rate > 0) rates[m[1]!] = rate;
  }
  return Object.keys(rates).length > 1 ? rates : null;
}

/** The rate date in the ECB's XML (`<Cube time='2026-10-09'>`), if any. */
export function ecbDate(xml: string): string | null {
  return xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1] ?? null;
}

/** Cents of `from` in `to` at these rates; null when a rate is missing. */
export function convertCents(cents: number, from: string, to: string, rates: Rates): number | null {
  if (from === to) return cents;
  const a = rates[from];
  const b = rates[to];
  if (!a || !b) return null;
  return Math.round((cents / a) * b);
}

/** The currency a page language suggests before the buyer picks one (Romanian: lei…). */
export function currencyForLocale(locale: Locale): ShownCurrency | null {
  return locale === 'ro' ? 'RON' : locale === 'hu' ? 'HUF' : null;
}

/** What the buyer sees prices in: their pick, else the language's currency, else the shop's. */
export function chosenCurrency(
  picked: string | null | undefined,
  locale: Locale,
  base: string,
): string {
  if (picked === 'base') return base;
  if (isShownCurrency(picked)) return picked;
  return currencyForLocale(locale) ?? base;
}

/** "≈ 112,40 lei" for a price in the shop's currency, or null when no conversion is shown. */
export function approxText(
  cents: number,
  fx: { base: string; code: string; factor: number } | null,
  tag: string,
): string | null {
  if (!fx || fx.code === fx.base) return null;
  return `≈ ${formatCents(Math.round(cents * fx.factor), fx.code, tag)}`;
}
