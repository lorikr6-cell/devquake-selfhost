import { ownerApi } from '../lib/api';
import { todayIn } from '../lib/dates';
import { salesDays, topItems } from '../lib/floor';

// GET /api/app/reports?month=YYYY-MM: a month's takings by day and its best-selling items, as
// the website's reports show them (the owner's Windows app). Defaults to this month.
export const GET = ownerApi(async ({ request, db, venue, ctx }) => {
  const raw = new URL(request.url).searchParams.get('month') ?? '';
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(raw)
    ? raw
    : todayIn(ctx.timeZone || 'UTC').slice(0, 7);
  const [y, m] = month.split('-').map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const [days, items] = await Promise.all([
    salesDays(db, venue.id, `${month}-01`, `${month}-${String(last).padStart(2, '0')}`),
    topItems(db, venue.id, month, month),
  ]);
  return { month, currency: venue.currency, decimals: venue.decimals, days, items };
});
