import { applyVoucher, type PublicVoucher } from './marketing';
import { applyRules, type PublicRule, type RuleResult } from './rules';
import type { CartLine, PaymentMethod } from './model';
import { orderTotals, priceNow, shippingCents, zoneFor, type Totals, type Zone } from './pricing';

// Checkout's sums: the cart checked against the database (prices, stock and sale windows come
// from there, never from the browser). Pure; tested in checkout.test.ts.

/** A variant as checkout reads it from the database. */
export interface SellableVariant {
  variantId: number;
  productId: number;
  productName: string;
  productSlug?: string;
  optionName: string;
  /** The product and the variant may be sold now (product published). */
  available: boolean;
  priceCents: number;
  saleCents: number | null;
  saleFrom: string | null;
  saleUntil: string | null;
  /** null: not counted. */
  stock: number | null;
  /** null: the store's rate. */
  vatRate: number | null;
  /** A running campaign's percentage for this product (0: none). */
  campaignPercent?: number;
}

export interface ItemSnapshot {
  productId: number;
  variantId: number;
  name: string;
  optionName: string;
  unitCents: number;
  vatRate: number;
  quantity: number;
}

export type CartProblem =
  | { kind: 'gone'; variantId: number }
  | { kind: 'stock'; variantId: number; left: number; name: string };

export type PricedCart =
  { ok: true; items: ItemSnapshot[] } | { ok: false; problems: CartProblem[] };

export function priceCart(
  lines: CartLine[],
  variants: SellableVariant[],
  storeVatRate: number,
  now: Date,
): PricedCart {
  const byId = new Map(variants.map((v) => [v.variantId, v]));
  const problems: CartProblem[] = [];
  const items: ItemSnapshot[] = [];
  for (const line of lines) {
    const v = byId.get(line.variantId);
    if (!v || !v.available) {
      problems.push({ kind: 'gone', variantId: line.variantId });
      continue;
    }
    if (v.stock !== null && v.stock < line.quantity) {
      const name = v.optionName ? `${v.productName} (${v.optionName})` : v.productName;
      problems.push({ kind: 'stock', variantId: v.variantId, left: Math.max(0, v.stock), name });
      continue;
    }
    items.push({
      productId: v.productId,
      variantId: v.variantId,
      name: v.productName,
      optionName: v.optionName,
      unitCents: priceNow(v, now, v.campaignPercent ?? 0).cents,
      vatRate: v.vatRate ?? storeVatRate,
      quantity: line.quantity,
    });
  }
  return problems.length > 0 ? { ok: false, problems } : { ok: true, items };
}

export interface QuoteInput {
  items: ItemSnapshot[];
  zones: Zone[];
  country: string;
  method: PaymentMethod;
  codFeeCents: number;
  storeVatRate: number;
  /** A voucher the buyer typed (checked against its counters by the server). */
  voucher?: PublicVoucher | null;
  /** The shop's live automatic discounts and free shipping. */
  rules?: PublicRule[];
}

export type Quote =
  | {
      ok: true;
      totals: Totals;
      zone: Zone;
      /** What the automatic rules gave (and what would unlock more). */
      auto: RuleResult;
      /** The voucher's part of totals.discountCents. */
      voucherCents: number;
    }
  | { ok: false; reason: 'country' | 'voucherMin' };

/**
 * Shipping by the country's zone (free from a rule, the zone's amount or a shipping voucher),
 * the cash-on-delivery fee, the automatic discount on the products, then a voucher's discount
 * on what is left, and the totals with VAT inside.
 */
export function quote(input: QuoteInput): Quote {
  const zone = zoneFor(input.zones, input.country);
  if (!zone) return { ok: false, reason: 'country' };
  const itemsCents = input.items.reduce((s, i) => s + i.unitCents * i.quantity, 0);
  const pieces = input.items.reduce((s, i) => s + i.quantity, 0);
  const auto = applyRules(input.rules ?? [], itemsCents, pieces);
  const voucher = input.voucher
    ? applyVoucher(input.voucher, itemsCents, itemsCents - auto.discountCents)
    : null;
  if (voucher && !voucher.ok) return { ok: false, reason: 'voucherMin' };
  const shipping = voucher?.freeShipping || auto.freeShipping ? 0 : shippingCents(zone, itemsCents);
  const fee = input.method === 'cod' ? input.codFeeCents : 0;
  const voucherCents = voucher?.discountCents ?? 0;
  return {
    ok: true,
    zone,
    auto,
    voucherCents,
    totals: orderTotals(
      input.items.map((i) => ({
        unitCents: i.unitCents,
        quantity: i.quantity,
        vatRate: i.vatRate,
      })),
      shipping,
      fee,
      input.storeVatRate,
      auto.discountCents + voucherCents,
    ),
  };
}

/**
 * The lines Stripe shows and charges: the items, then shipping and the fee as their own lines.
 * Stripe has no negative lines, so a discounted order is charged as one line with its total.
 */
export function chargeLines(
  items: Array<Pick<ItemSnapshot, 'name' | 'optionName' | 'unitCents' | 'quantity'>>,
  totals: Totals,
  labels: { shipping: string; fee: string; order: string },
): Array<{ name: string; unitCents: number; quantity: number }> {
  if (totals.discountCents > 0) {
    return [{ name: labels.order, unitCents: totals.totalCents, quantity: 1 }];
  }
  const lines = items.map((i) => ({
    name: i.optionName ? `${i.name} (${i.optionName})` : i.name,
    unitCents: i.unitCents,
    quantity: i.quantity,
  }));
  if (totals.shippingCents > 0) {
    lines.push({ name: labels.shipping, unitCents: totals.shippingCents, quantity: 1 });
  }
  if (totals.feeCents > 0)
    lines.push({ name: labels.fee, unitCents: totals.feeCents, quantity: 1 });
  return lines;
}
