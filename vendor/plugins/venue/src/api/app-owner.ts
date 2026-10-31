import { listStaff, listTablets, menuOf } from '../lib/data';
import { todayIn } from '../lib/dates';
import { listTables, salesDays } from '../lib/floor';
import { openCalls } from '../lib/calls';
import { ownerApi } from '../lib/api';
import { allergensOf, formatMinor } from '../lib/model';
import { ingredientsOf } from '../lib/stock';

// GET /api/app/owner: everything the owner's Windows app shows in one answer (the venue, the
// menu with every field to edit, tables, staff, devices, stock and today's takings). The owner
// only (device sign-in on venue.devquake.com, ADR 0067); format 1.
export const GET = ownerApi(async ({ db, venue, ctx }) => {
  const today = todayIn(ctx.timeZone || 'UTC');
  const [menu, tables, staff, tablets, calls, days, ingredients] = await Promise.all([
    menuOf(db, venue.id),
    listTables(db, venue.id),
    listStaff(db, venue.id),
    listTablets(db, venue.id),
    openCalls(db, venue.id),
    salesDays(db, venue.id, today, today),
    ingredientsOf(db, venue.id),
  ]);
  return {
    format: 1,
    venue: {
      name: venue.name,
      slug: venue.slug,
      country: venue.country,
      currency: venue.currency,
      decimals: venue.decimals,
      vatRates: venue.vatRates,
      menuPublic: venue.menuPublic,
      menuUrl: `${ctx.baseUrl}/m/${venue.slug}`,
    },
    today: { day: today, bills: days[0]?.bills ?? 0, gross: days[0]?.gross ?? 0 },
    categories: menu.categories,
    items: menu.items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      name: i.name,
      description: i.description,
      priceMinor: i.priceMinor,
      price: formatMinor(i.priceMinor, venue.decimals),
      vatRate: i.vatRate,
      station: i.station,
      allergens: allergensOf(i.allergens),
      available: i.available,
      short: i.short,
    })),
    tables: tables.map((t) => ({
      id: t.id,
      name: t.name,
      seats: t.seats,
      waiterId: t.waiterId,
      open: t.bill ? { gross: t.bill.gross, waiterName: t.bill.waiterName } : null,
    })),
    staff,
    devices: tablets.map((d) => ({
      id: d.id,
      name: d.name,
      kind: d.kind,
      createdAt: new Date(d.createdAt).toISOString(),
      lastUsedAt: d.lastUsedAt ? new Date(d.lastUsedAt).toISOString() : null,
    })),
    stock: ingredients,
    openCalls: calls.length,
  };
});
