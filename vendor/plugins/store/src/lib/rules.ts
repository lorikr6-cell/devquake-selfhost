import { isLive, type Window } from './marketing';

// Automatic discounts and free shipping (ADR 0058): rules the owner sets, applied at checkout
// without a code and shown to buyers in the cart. Pure and tested (growth.test.ts).

export const RULE_KINDS = ['free_shipping', 'spend', 'quantity'] as const;
export type RuleKind = (typeof RULE_KINDS)[number];

export interface PriceRule extends Window {
  id: number;
  kind: RuleKind;
  /** Cents for free_shipping and spend; pieces for quantity. */
  threshold: number;
  /** For spend and quantity. */
  percentOff: number | null;
}

/** What buyers' browsers get to show and compute the rules (live ones only). */
export type PublicRule = Pick<PriceRule, 'id' | 'kind' | 'threshold' | 'percentOff'>;

export const publicRules = (rules: PriceRule[], now: Date): PublicRule[] =>
  rules
    .filter((r) => isLive(r, now))
    .map(({ id, kind, threshold, percentOff }) => ({ id, kind, threshold, percentOff }));

export interface RuleResult {
  /** The best discount reached (highest percentage), or null. */
  discount: {
    ruleId: number;
    kind: 'spend' | 'quantity';
    threshold: number;
    percent: number;
  } | null;
  discountCents: number;
  freeShipping: boolean;
  /** The next better discount not reached yet, and what is missing (cents or pieces). */
  next: { kind: 'spend' | 'quantity'; missing: number; percent: number } | null;
  /** What is missing for free shipping (cents); null when there is no such rule or it is met. */
  freeShippingMissing: number | null;
}

/**
 * The rules for a cart of `itemsCents` (products, after campaigns and sales) and `pieces`: the
 * best percentage reached on the products, free shipping, and what would unlock the next step.
 */
export function applyRules(rules: PublicRule[], itemsCents: number, pieces: number): RuleResult {
  const reached = (r: PublicRule) => (r.kind === 'quantity' ? pieces : itemsCents) >= r.threshold;
  const discounts = rules.filter(
    (r): r is PublicRule & { kind: 'spend' | 'quantity'; percentOff: number } =>
      (r.kind === 'spend' || r.kind === 'quantity') &&
      r.percentOff !== null &&
      r.percentOff > 0 &&
      r.percentOff < 100,
  );
  const best = discounts
    .filter(reached)
    .sort((a, b) => b.percentOff - a.percentOff || a.threshold - b.threshold)[0];
  const percent = best?.percentOff ?? 0;
  const next = discounts
    .filter((r) => !reached(r) && r.percentOff > percent)
    .map((r) => ({
      kind: r.kind,
      missing: r.threshold - (r.kind === 'quantity' ? pieces : itemsCents),
      percent: r.percentOff,
    }))
    .sort((a, b) => b.percent / Math.max(1, b.missing) - a.percent / Math.max(1, a.missing))[0];
  const shipping = rules.filter((r) => r.kind === 'free_shipping');
  const freeShipping = shipping.some(reached);
  const lowest = shipping.reduce<number | null>(
    (min, r) => (min === null || r.threshold < min ? r.threshold : min),
    null,
  );
  return {
    discount: best
      ? { ruleId: best.id, kind: best.kind, threshold: best.threshold, percent: best.percentOff }
      : null,
    discountCents: Math.round((itemsCents * percent) / 100),
    freeShipping,
    next: next ?? null,
    freeShippingMissing: freeShipping || lowest === null ? null : lowest - itemsCents,
  };
}

type T = (key: string, params?: Record<string, string | number>) => string;

/** "−10 % from 5 items" / "−5 % from €100": the discount as cart, checkout and order say it. */
export function ruleLabel(
  t: T,
  d: NonNullable<RuleResult['discount']>,
  money: (cents: number) => string,
): string {
  return d.kind === 'quantity'
    ? t('labelQuantity', { percent: d.percent, count: d.threshold })
    : t('labelSpend', { percent: d.percent, amount: money(d.threshold) });
}

/** "Add 2 more items for 10 % off" / "Spend €12 more for free shipping". */
export function ruleHints(t: T, r: RuleResult, money: (cents: number) => string): string[] {
  const out: string[] = [];
  if (r.next) {
    out.push(
      r.next.kind === 'quantity'
        ? t('hintQuantity', { count: r.next.missing, percent: r.next.percent })
        : t('hintSpend', { amount: money(r.next.missing), percent: r.next.percent }),
    );
  }
  if (r.freeShippingMissing !== null && r.freeShippingMissing > 0) {
    out.push(t('hintShipping', { amount: money(r.freeShippingMissing) }));
  }
  return out;
}
