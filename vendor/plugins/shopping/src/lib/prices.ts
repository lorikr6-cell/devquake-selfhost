// Price history (inflation): how the price of the same product changes over time, and how far
// planned prices were from the prices paid. Pure, unit-tested (prices.test.ts).

export interface PriceObservation {
  /** The product as typed ("Milk 1.5%"). */
  product: string;
  unit: string | null;
  currency: string;
  kind: 'estimate' | 'actual';
  price: number;
  /** The list's shopping day, "YYYY-MM-DD". */
  observedOn: string;
  /** The item it belongs to (null when the item was deleted). */
  itemId: number | null;
}

export interface PriceChange {
  product: string;
  unit: string | null;
  currency: string;
  first: { price: number; on: string };
  last: { price: number; on: string };
  /** (last − first) ÷ first × 100, rounded to 0.1. */
  changePercent: number;
  /** How many days had a price. */
  points: number;
}

/** The same product whatever the capitals, accents or spaces ("Lapte " = "lapte"). */
export function productKey(product: string, unit: string | null, currency: string): string {
  const fold = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  return `${fold(product)}|${fold(unit ?? '')}|${currency}`;
}

/**
 * One price per product and day: the paid price when there is one (it is the real price), else
 * the planned one; several on the same day are averaged.
 */
function dailyPrices(observations: PriceObservation[]) {
  const byKey = new Map<string, Map<string, { actual: number[]; estimate: number[] }>>();
  const names = new Map<string, PriceObservation>();
  for (const o of observations) {
    const key = productKey(o.product, o.unit, o.currency);
    if (!names.has(key)) names.set(key, o);
    const days = byKey.get(key) ?? new Map();
    const day = days.get(o.observedOn) ?? { actual: [], estimate: [] };
    day[o.kind].push(o.price);
    days.set(o.observedOn, day);
    byKey.set(key, days);
  }
  const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
  return [...byKey.entries()].map(([key, days]) => ({
    sample: names.get(key)!,
    points: [...days.entries()]
      .map(([on, d]) => ({ on, price: avg(d.actual.length ? d.actual : d.estimate) }))
      .sort((a, b) => a.on.localeCompare(b.on)),
  }));
}

/**
 * Products with prices on at least two different days: first and latest price and the change
 * in percent, biggest change first. At most `limit` products.
 */
export function priceChanges(observations: PriceObservation[], limit = 20): PriceChange[] {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return dailyPrices(observations)
    .filter((p) => p.points.length >= 2 && p.points[0]!.price > 0)
    .map(({ sample, points }) => {
      const first = points[0]!;
      const last = points[points.length - 1]!;
      return {
        product: sample.product,
        unit: sample.unit,
        currency: sample.currency,
        first: { price: round2(first.price), on: first.on },
        last: { price: round2(last.price), on: last.on },
        changePercent: Math.round(((last.price - first.price) / first.price) * 1000) / 10,
        points: points.length,
      };
    })
    .sort(
      (a, b) =>
        Math.abs(b.changePercent) - Math.abs(a.changePercent) || a.product.localeCompare(b.product),
    )
    .slice(0, limit);
}

/**
 * The average change of all products that have one (plain average of their percentages); null
 * without any. A simple "my own inflation" figure.
 */
export function averageChange(changes: PriceChange[]): number | null {
  if (changes.length === 0) return null;
  return Math.round((changes.reduce((a, c) => a + c.changePercent, 0) / changes.length) * 10) / 10;
}

/**
 * How far planned prices were from the prices paid: for items with both, the average of
 * (paid − planned) ÷ planned in percent (positive: things cost more than planned), and how many
 * items that is. null when no item had its price corrected.
 */
export function estimateAccuracy(
  observations: PriceObservation[],
): { averagePercent: number; items: number } | null {
  const byItem = new Map<number, { estimate?: number; actual?: number }>();
  for (const o of observations) {
    if (o.itemId === null) continue;
    const entry = byItem.get(o.itemId) ?? {};
    // The last planned price before shopping, and the last price paid.
    entry[o.kind] = o.price;
    byItem.set(o.itemId, entry);
  }
  const diffs = [...byItem.values()]
    .filter((e) => e.estimate !== undefined && e.actual !== undefined && e.estimate > 0)
    .map((e) => ((e.actual! - e.estimate!) / e.estimate!) * 100);
  if (diffs.length === 0) return null;
  return {
    averagePercent: Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10,
    items: diffs.length,
  };
}
