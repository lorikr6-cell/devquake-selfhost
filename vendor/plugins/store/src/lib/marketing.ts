// Campaigns, vouchers and announcements: the pure rules, shared by pages, the API, checkout and
// tests (marketing.test.ts). Times are ISO strings in UTC; null means no limit on that side.

export const CAMPAIGN_SCOPES = ['all', 'category', 'products'] as const;
export type CampaignScope = (typeof CAMPAIGN_SCOPES)[number];

export const VOUCHER_KINDS = ['percent', 'amount', 'shipping'] as const;
export type VoucherKind = (typeof VOUCHER_KINDS)[number];

export const ANNOUNCEMENT_TONES = ['info', 'sale', 'new', 'warning'] as const;
export type AnnouncementTone = (typeof ANNOUNCEMENT_TONES)[number];

export const ANNOUNCEMENT_PLACEMENTS = ['bar', 'banner'] as const;
export type AnnouncementPlacement = (typeof ANNOUNCEMENT_PLACEMENTS)[number];

export interface Window {
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

/** Switched on and inside its window at `now`. */
export function isLive(w: Window, now: Date): boolean {
  const t = now.getTime();
  return (
    w.active &&
    (w.startsAt === null || Date.parse(w.startsAt) <= t) &&
    (w.endsAt === null || t < Date.parse(w.endsAt))
  );
}

/** Where something stands for the owner's lists. */
export function windowState(w: Window, now: Date): 'off' | 'scheduled' | 'live' | 'ended' {
  if (!w.active) return 'off';
  const t = now.getTime();
  if (w.endsAt !== null && t >= Date.parse(w.endsAt)) return 'ended';
  if (w.startsAt !== null && t < Date.parse(w.startsAt)) return 'scheduled';
  return 'live';
}

export interface CampaignRule extends Window {
  id: number;
  name: string;
  percentOff: number;
  scope: CampaignScope;
  category: string | null;
  productIds: number[];
}

/** The live campaign giving this product the most off, or null. */
export function campaignFor(
  product: { id: number; category: string | null },
  campaigns: CampaignRule[],
  now: Date,
): CampaignRule | null {
  let best: CampaignRule | null = null;
  for (const c of campaigns) {
    if (!isLive(c, now)) continue;
    const applies =
      c.scope === 'all' ||
      (c.scope === 'category' && c.category !== null && c.category === product.category) ||
      (c.scope === 'products' && c.productIds.includes(product.id));
    if (applies && (!best || c.percentOff > best.percentOff)) best = c;
  }
  return best;
}

/** "summer 10" → "SUMMER10": codes are compared in capitals without spaces. */
export function normalizeCode(text: string): string {
  return text.replace(/\s+/g, '').toUpperCase();
}

export const VOUCHER_CODE = /^[A-Z0-9_-]{3,30}$/;

export interface VoucherRule extends Window {
  id: number;
  code: string;
  description: string | null;
  kind: VoucherKind;
  percentOff: number | null;
  amountCents: number | null;
  minOrderCents: number | null;
  maxUses: number | null;
  uses: number;
  oncePerBuyer: boolean;
}

/** What a buyer's browser gets to show the discount (no counters). */
export type PublicVoucher = Pick<
  VoucherRule,
  'code' | 'description' | 'kind' | 'percentOff' | 'amountCents' | 'minOrderCents'
>;

export const publicVoucher = (v: VoucherRule): PublicVoucher => ({
  code: v.code,
  description: v.description,
  kind: v.kind,
  percentOff: v.percentOff,
  amountCents: v.amountCents,
  minOrderCents: v.minOrderCents,
});

export type VoucherProblem = 'unknown' | 'notLive' | 'usedUp' | 'minOrder' | 'usedByBuyer';

/** Whether the voucher can be used now (counters and the buyer's earlier orders aside). */
export function voucherProblem(v: VoucherRule | null, now: Date): VoucherProblem | null {
  if (!v) return 'unknown';
  if (!isLive(v, now)) return 'notLive';
  if (v.maxUses !== null && v.uses >= v.maxUses) return 'usedUp';
  return null;
}

/**
 * What the voucher takes off an order of `itemsCents` (products, after campaigns and sales):
 * the products' discount and whether shipping is free; a problem when the order is too small.
 * `base` is what the discount applies to when an automatic discount came first.
 */
export function applyVoucher(
  v: PublicVoucher,
  itemsCents: number,
  base: number = itemsCents,
): { ok: true; discountCents: number; freeShipping: boolean } | { ok: false; problem: 'minOrder' } {
  if (v.minOrderCents !== null && itemsCents < v.minOrderCents)
    return { ok: false, problem: 'minOrder' };
  switch (v.kind) {
    case 'percent':
      return {
        ok: true,
        discountCents: Math.round((base * (v.percentOff ?? 0)) / 100),
        freeShipping: false,
      };
    case 'amount':
      return {
        ok: true,
        discountCents: Math.min(base, v.amountCents ?? 0),
        freeShipping: false,
      };
    case 'shipping':
      return { ok: true, discountCents: 0, freeShipping: true };
  }
}
