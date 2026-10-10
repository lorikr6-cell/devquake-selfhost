// Prices, VAT, shipping and order totals: pure, in whole cents, unit-tested (pricing.test.ts).
// Prices include VAT (ADR 0057): the VAT in a gross amount is gross × rate / (100 + rate).

export interface PricedVariant {
  priceCents: number;
  saleCents: number | null;
  /** ISO times (UTC); null = no limit on that side. */
  saleFrom: string | null;
  saleUntil: string | null;
}

export interface PriceNow {
  cents: number;
  regularCents: number;
  onSale: boolean;
  /** A campaign's percentage made this price (lower than the option's own sale price). */
  campaign: boolean;
}

/** `cents` less `percent` %, rounded to the cent. */
export const percentOff = (cents: number, percent: number) =>
  Math.max(0, Math.round((cents * (100 - percent)) / 100));

/**
 * The price at `now`: the lowest of the regular price, the option's sale price while its window
 * is open, and the regular price less a running campaign's percentage (`campaignPercent`).
 */
export function priceNow(v: PricedVariant, now: Date = new Date(), campaignPercent = 0): PriceNow {
  const t = now.getTime();
  const open =
    v.saleCents !== null &&
    v.saleCents < v.priceCents &&
    (v.saleFrom === null || Date.parse(v.saleFrom) <= t) &&
    (v.saleUntil === null || t < Date.parse(v.saleUntil));
  const sale = open ? v.saleCents! : v.priceCents;
  const campaign =
    campaignPercent > 0 && campaignPercent < 100 ? percentOff(v.priceCents, campaignPercent) : null;
  const byCampaign = campaign !== null && campaign < sale;
  const cents = byCampaign ? campaign : sale;
  return {
    cents,
    regularCents: v.priceCents,
    onSale: cents < v.priceCents,
    campaign: byCampaign,
  };
}

/** The VAT inside a gross amount (cents) at `rate` percent. */
export function vatPart(grossCents: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round((grossCents * rate) / (100 + rate));
}

export interface Zone {
  id: number;
  name: string;
  /** ISO 3166-1 alpha-2 codes, upper case; '*' = every other country. */
  countries: string[];
  rateCents: number;
  freeFromCents: number | null;
}

/** The zone shipping to `country`: one naming it, else one with '*', else null (no shipping). */
export function zoneFor(zones: Zone[], country: string): Zone | null {
  const c = country.toUpperCase();
  return (
    zones.find((z) => z.countries.includes(c)) ??
    zones.find((z) => z.countries.includes('*')) ??
    null
  );
}

/** Shipping for an order of `itemsCents` in `zone`: free from its threshold. */
export function shippingCents(zone: Zone, itemsCents: number): number {
  return zone.freeFromCents !== null && itemsCents >= zone.freeFromCents ? 0 : zone.rateCents;
}

export interface OrderLine {
  unitCents: number;
  quantity: number;
  vatRate: number;
}

export interface Totals {
  itemsCents: number;
  /** Taken off the products by a voucher (not more than their sum). */
  discountCents: number;
  shippingCents: number;
  feeCents: number;
  totalCents: number;
  /** VAT included in the total: per line at its rate, shipping and fees at the store's rate. */
  vatCents: number;
}

/**
 * A discount spread over the lines by their share of the sum (the last line takes the rounding
 * rest), so each line's VAT is counted on what is really paid for it.
 */
export function spreadDiscount(lineCents: number[], discount: number): number[] {
  const sum = lineCents.reduce((s, c) => s + c, 0);
  if (discount <= 0 || sum <= 0) return lineCents.map(() => 0);
  const d = Math.min(discount, sum);
  let given = 0;
  return lineCents.map((c, i) => {
    if (i === lineCents.length - 1) return d - given;
    const share = Math.floor((d * c) / sum);
    given += share;
    return share;
  });
}

export function orderTotals(
  lines: OrderLine[],
  shipping: number,
  fee: number,
  storeVatRate: number,
  discount = 0,
): Totals {
  const gross = lines.map((l) => l.unitCents * l.quantity);
  const itemsCents = gross.reduce((sum, c) => sum + c, 0);
  const shares = spreadDiscount(gross, discount);
  const discountCents = shares.reduce((s, c) => s + c, 0);
  const vatCents =
    lines.reduce((sum, l, i) => sum + vatPart(gross[i]! - shares[i]!, l.vatRate), 0) +
    vatPart(shipping + fee, storeVatRate);
  return {
    itemsCents,
    discountCents,
    shippingCents: shipping,
    feeCents: fee,
    totalCents: itemsCents - discountCents + shipping + fee,
    vatCents,
  };
}

/** "12,50" or "12.50" → 1250 cents; null when it is not an amount with up to 2 decimals. */
export function parseCents(value: unknown, max = 99_999_999): number | null {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '';
  const clean = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, part = ''] = clean.split('.');
  const cents = Number(whole) * 100 + Number(part.padEnd(2, '0'));
  return cents <= max ? cents : null;
}

/** Cents as a plain amount for forms ("12.50"). */
export const centsToText = (cents: number) => (cents / 100).toFixed(2);

/** Money in the page language ("12,50 lei", "€12.50"). */
export function formatCents(cents: number, currency: string, tag: string): string {
  try {
    return new Intl.NumberFormat(tag, { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
