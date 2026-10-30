// A bill's numbers (pure, tested): prices on the menu include VAT, so each line's VAT is taken
// out of its gross price; the tip is counted on the bill before VAT (the owner's rule), as the
// owner set it up (off, the guest's chosen percentage, or a fixed tip).

import type { TipSettings } from './model';

export interface BillLine {
  priceMinor: number;
  vatRate: number;
  qty: number;
  delivered: number;
}

export interface BillTotals {
  /** What the guest pays for the items, VAT included. */
  gross: number;
  /** The same without VAT. */
  net: number;
  /** VAT by rate: the part of the gross that is VAT. */
  vat: { rate: number; net: number; vat: number }[];
  tip: number;
  /** Gross plus tip. */
  total: number;
  /** Items still to bring (quantities). */
  pending: number;
}

/** The part of a VAT-included amount without VAT, rounded to the minor unit. */
export const netOf = (gross: number, rate: number) => Math.round((gross * 10000) / (10000 + rate));

/** The guest's tip choice: a percentage (basis points), the fixed tip, or none. */
export interface TipChoice {
  percent: number | null;
  fixed: boolean;
}

export function tipFor(net: number, tips: TipSettings, choice: TipChoice): number {
  if (tips.tipMode === 'off') return 0;
  if (tips.tipMode === 'fixed') return choice.fixed ? tips.tipFixedMinor : 0;
  if (choice.percent === null || !tips.tipPercents.includes(choice.percent)) return 0;
  return Math.round((net * choice.percent) / 10000);
}

export function billTotals(lines: BillLine[], tips: TipSettings, choice: TipChoice): BillTotals {
  const byRate = new Map<number, number>();
  let pending = 0;
  for (const l of lines) {
    byRate.set(l.vatRate, (byRate.get(l.vatRate) ?? 0) + l.priceMinor * l.qty);
    pending += Math.max(0, l.qty - l.delivered);
  }
  const vat = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, gross]) => {
      const net = netOf(gross, rate);
      return { rate, net, vat: gross - net };
    });
  const gross = [...byRate.values()].reduce((a, b) => a + b, 0);
  const net = vat.reduce((a, v) => a + v.net, 0);
  const tip = tipFor(net, tips, choice);
  return { gross, net, vat, tip, total: gross + tip, pending };
}

/** A random code of `length` letters and digits without look-alikes (0/O, 1/l/I). */
export function newCode(length: number, random: (n: number) => number): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[random(alphabet.length)];
  return out;
}

export const TABLE_CODE = /^[a-zA-Z2-9]{10}$/;
export const BILL_CODE = /^[a-zA-Z2-9]{12}$/;

/** Finalised bills are deleted after this many days; the numbers stay (sales_days, sales_items). */
export const BILL_KEEP_DAYS = 183;
/** A staff member stays on a tablet this long after their PIN, unless someone switches. */
export const TABLET_SHIFT_HOURS = 8;
/** Wrong PINs in a row before that staff member waits PIN_WAIT_MINUTES on that venue. */
export const PIN_TRIES = 5;
export const PIN_WAIT_MINUTES = 15;
export const PAYMENTS = ['cash', 'card', 'other'] as const;
export type Payment = (typeof PAYMENTS)[number];
export const QTY_MAX = 99;
export const NOTE_MAX = 120;
