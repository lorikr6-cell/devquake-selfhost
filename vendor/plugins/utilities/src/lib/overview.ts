// The calendar (month and year) and the statistics: pure aggregation of the user's own part of
// every bill they share. Unit-tested (overview.test.ts). Consumption is only added up within one
// category and unit; money only within one currency.

import type { BillStatus } from './split';
import { monthsOf, type IsoMonth } from './dates';

/** One bill as the signed-in user sees it (built by data.ts from the bill's split). */
export interface OverviewBill {
  billId: number;
  utilityId: number;
  utilityName: string;
  category: string;
  currency: string;
  unit: string | null;
  period: IsoMonth;
  /** "YYYY-MM-DD" the bill is due, when known. */
  dueOn?: string | null;
  total: number;
  /** Consumption on the provider's bill. */
  consumption: number | null;
  unitPrice: number | null;
  status: BillStatus;
  isOwner: boolean;
  /** The user's own consumption (their reading; the whole bill when they use it alone). */
  myConsumption: number | null;
  /** The user's share of the bill; null while it cannot be computed. */
  myShare: number | null;
  /**
   * What the user has paid: for the owner their share once the provider is paid, for the
   * others what the owner recorded as received.
   */
  myPaid: number;
}

export interface MoneyTotals {
  currency: string;
  billed: number;
  share: number;
  paid: number;
}

export interface MonthSummary {
  month: IsoMonth;
  bills: OverviewBill[];
  money: MoneyTotals[];
  /** Bills of the month not paid yet (warning) or waiting for readings. */
  open: number;
}

const round = (value: number, digits = 2) => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

export function moneyTotals(bills: OverviewBill[]): MoneyTotals[] {
  const map = new Map<string, MoneyTotals>();
  for (const b of bills) {
    const t = map.get(b.currency) ?? { currency: b.currency, billed: 0, share: 0, paid: 0 };
    t.billed = round(t.billed + b.total);
    t.share = round(t.share + (b.myShare ?? 0));
    t.paid = round(t.paid + b.myPaid);
    map.set(b.currency, t);
  }
  return [...map.values()].sort((a, b) => b.share - a.share);
}

/** The twelve months of `year`, each with its bills (sorted by category and name). */
export function monthSummaries(bills: OverviewBill[], year: number): MonthSummary[] {
  return monthsOf(year).map((month) => {
    const of = bills
      .filter((b) => b.period === month)
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.utilityName.localeCompare(b.utilityName),
      );
    return {
      month,
      bills: of,
      money: moneyTotals(of),
      open: of.filter((b) => b.status !== 'paid').length,
    };
  });
}

export interface SeriesPoint {
  month: IsoMonth;
  consumption: number | null;
  share: number | null;
  paid: number | null;
  unitPrice: number | null;
}

/** One category in one unit and currency, month by month through the year. */
export interface CategorySeries {
  key: string;
  category: string;
  unit: string | null;
  currency: string;
  points: SeriesPoint[];
  totals: {
    consumption: number | null;
    share: number;
    paid: number;
    /** Billed money ÷ billed consumption over the year (null without consumption). */
    unitPrice: number | null;
    bills: number;
  };
}

export function categoryStats(bills: OverviewBill[], year: number): CategorySeries[] {
  const months = monthsOf(year);
  const inYear = bills.filter((b) => b.period.startsWith(`${year}-`));
  const groups = new Map<string, OverviewBill[]>();
  for (const b of inYear) {
    const key = `${b.category}|${b.unit ?? ''}|${b.currency}`;
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }
  const series = [...groups.entries()].map(([key, group]): CategorySeries => {
    const first = group[0]!;
    const points = months.map((month): SeriesPoint => {
      const of = group.filter((b) => b.period === month);
      if (of.length === 0) {
        return { month, consumption: null, share: null, paid: null, unitPrice: null };
      }
      const consumptions = of.map((b) => b.myConsumption).filter((c): c is number => c !== null);
      const prices = of.map((b) => b.unitPrice).filter((p): p is number => p !== null);
      return {
        month,
        consumption: consumptions.length
          ? round(
              consumptions.reduce((a, c) => a + c, 0),
              3,
            )
          : null,
        share: round(of.reduce((a, b) => a + (b.myShare ?? 0), 0)),
        paid: round(of.reduce((a, b) => a + b.myPaid, 0)),
        unitPrice: prices.length
          ? round(prices.reduce((a, p) => a + p, 0) / prices.length, 4)
          : null,
      };
    });
    const withConsumption = group.filter((b) => b.consumption !== null && b.consumption > 0);
    const billedConsumption = withConsumption.reduce((a, b) => a + b.consumption!, 0);
    const myConsumption = group.map((b) => b.myConsumption).filter((c): c is number => c !== null);
    return {
      key,
      category: first.category,
      unit: first.unit,
      currency: first.currency,
      points,
      totals: {
        consumption: myConsumption.length
          ? round(
              myConsumption.reduce((a, c) => a + c, 0),
              3,
            )
          : null,
        share: round(group.reduce((a, b) => a + (b.myShare ?? 0), 0)),
        paid: round(group.reduce((a, b) => a + b.myPaid, 0)),
        unitPrice:
          billedConsumption > 0
            ? round(withConsumption.reduce((a, b) => a + b.total, 0) / billedConsumption, 4)
            : null,
        bills: group.length,
      },
    };
  });
  return series.sort((a, b) => b.totals.share - a.totals.share);
}

/** Years that have bills, newest first (always includes `current`). */
export function yearsWithBills(bills: OverviewBill[], current: number): number[] {
  const years = new Set<number>([current]);
  for (const b of bills) years.add(Number(b.period.slice(0, 4)));
  return [...years].sort((a, b) => b - a);
}
