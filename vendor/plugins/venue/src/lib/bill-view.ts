import type { Venue } from './data';
import { billTotals } from './bill';
import type { Bill } from './floor';

/** A bill as the floor and the guests see it: its lines and totals (never other bills). */
export function billView(bill: Bill, venue: Venue) {
  return {
    id: bill.id,
    code: bill.code,
    status: bill.status,
    tableName: bill.tableName,
    openedBy: bill.openedBy,
    openedAt: bill.openedAt.toISOString(),
    finalizedAt: bill.finalizedAt?.toISOString() ?? null,
    finalizedBy: bill.finalizedBy,
    payment: bill.payment,
    tip: bill.tip,
    lines: bill.lines.map((l) => ({
      id: l.id,
      name: l.name,
      priceMinor: l.priceMinor,
      vatRate: l.vatRate,
      station: l.station,
      qty: l.qty,
      delivered: l.delivered,
      note: l.note,
      addedBy: l.addedBy,
    })),
    totals: billTotals(bill.lines, venue.tips, bill.tip),
  };
}

export type BillView = ReturnType<typeof billView>;
