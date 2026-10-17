// Interest votes (ADR 0060): before a product is made and sold, buyers say whether they would buy
// it, optionally at what price and in which colour, size or fit. The owner sees the demand and an
// estimate of the price, units, revenue and return on investment. Pure, so it is fully tested.

export const INTEREST_LIMITS = {
  /** The highest price a voter may give, in whole currency units. */
  maxPrice: 100_000,
  /** Fewer interested voters than this: too early to judge. */
  minVotes: 10,
  /** Below this return the product earns too little for the work. */
  thinRoiPercent: 20,
} as const;

export interface InterestVote {
  interested: boolean;
  /** Acceptable price range in cents, each optional. */
  minCents: number | null;
  maxCents: number | null;
  /** Option label → the voter's choice ("Colour" → "Black"). */
  choices: Record<string, string>;
}

/** What a product offers to choose from: its multi-choice fields and their picked values. */
export interface InterestOption {
  label: string;
  values: string[];
}

/** The options of a product: every multi-choice field with at least two offered values. */
export function interestOptions(
  fields: Array<{ id: number; label: string; kind: string }>,
  values: Record<number, string>,
): InterestOption[] {
  return fields
    .filter((f) => f.kind === 'multiselect')
    .map((f) => ({
      label: f.label,
      values: (values[f.id] ?? '')
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean),
    }))
    .filter((o) => o.values.length >= 2);
}

/** The voter's choices, kept only where they name an offered option and value. */
export function cleanChoices(raw: unknown, options: InterestOption[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const o of options) {
    const v = (raw as Record<string, unknown>)[o.label];
    if (typeof v === 'string' && o.values.includes(v)) out[o.label] = v;
  }
  return out;
}

export type InterestVerdict = 'early' | 'loss' | 'thin' | 'good' | 'noCosts';

export interface InterestReport {
  interested: number;
  notInterested: number;
  /** Interested voters who gave a price. */
  priced: number;
  /** Medians of the given ranges' ends, in cents. */
  medianMinCents: number | null;
  medianMaxCents: number | null;
  /** The price (gross) that earns the most from the voters' stated limits. */
  suggestedCents: number | null;
  /** Interested voters expected to buy at that price (voters without a price in the same share). */
  units: number;
  /** At the suggested price, before shipping; net of VAT. */
  revenueCents: number;
  investmentCents: number | null;
  profitCents: number | null;
  roiPercent: number | null;
  /** Pieces to sell before the one-time costs are covered; null when each piece loses money. */
  breakEvenUnits: number | null;
  verdict: InterestVerdict;
  /** Option label → value → interested voters who chose it, most chosen first. */
  preferences: Array<{ label: string; counts: Array<{ value: string; count: number }> }>;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

const net = (gross: number, vatRate: number) => gross / (1 + vatRate / 100);

/**
 * Demand and the return it suggests. Each priced voter buys at any price up to the top of their
 * range; the suggested price earns the most (after the cost per piece, when known) from them.
 */
export function interestReport(
  votes: InterestVote[],
  costs: { unitCents: number | null; setupCents: number | null },
  vatRate: number,
): InterestReport {
  const yes = votes.filter((v) => v.interested);
  const ranges = yes
    .filter((v) => v.minCents !== null || v.maxCents !== null)
    .map((v) => {
      const a = v.minCents ?? v.maxCents!;
      const b = v.maxCents ?? v.minCents!;
      return { low: Math.min(a, b), high: Math.max(a, b) };
    });
  const unit = costs.unitCents;
  const setup = costs.setupCents ?? 0;

  let suggested: number | null = null;
  let buyers = 0;
  let best = -Infinity;
  for (const price of [...new Set(ranges.map((r) => r.high))].sort((a, b) => a - b)) {
    const count = ranges.filter((r) => r.high >= price).length;
    const perPiece = net(price, vatRate) - (unit ?? 0);
    const value = perPiece * count;
    if (value > best) {
      best = value;
      suggested = price;
      buyers = count;
    }
  }
  const unpriced = yes.length - ranges.length;
  const units =
    suggested === null
      ? 0
      : buyers + (ranges.length > 0 ? Math.round((unpriced * buyers) / ranges.length) : 0);
  const revenue = suggested === null ? 0 : Math.round(net(suggested, vatRate) * units);

  let investment: number | null = null;
  let profit: number | null = null;
  let roi: number | null = null;
  let breakEven: number | null = null;
  if (unit !== null && suggested !== null) {
    investment = units * unit + setup;
    profit = revenue - investment;
    roi = investment > 0 ? Math.round((profit / investment) * 1000) / 10 : null;
    const perPiece = net(suggested, vatRate) - unit;
    breakEven = perPiece > 0 ? Math.ceil(setup / perPiece) : null;
  }

  const verdict: InterestVerdict =
    yes.length < INTEREST_LIMITS.minVotes || suggested === null
      ? 'early'
      : unit === null
        ? 'noCosts'
        : profit! < 0
          ? 'loss'
          : roi !== null && roi < INTEREST_LIMITS.thinRoiPercent
            ? 'thin'
            : 'good';

  const labels = [...new Set(yes.flatMap((v) => Object.keys(v.choices)))];
  const preferences = labels.map((label) => {
    const counts = new Map<string, number>();
    for (const v of yes) {
      const value = v.choices[label];
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return {
      label,
      counts: [...counts]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    };
  });

  return {
    interested: yes.length,
    notInterested: votes.length - yes.length,
    priced: ranges.length,
    medianMinCents: median(ranges.map((r) => r.low)),
    medianMaxCents: median(ranges.map((r) => r.high)),
    suggestedCents: suggested,
    units,
    revenueCents: revenue,
    investmentCents: investment,
    profitCents: profit,
    roiPercent: roi,
    breakEvenUnits: breakEven,
    verdict,
    preferences,
  };
}
