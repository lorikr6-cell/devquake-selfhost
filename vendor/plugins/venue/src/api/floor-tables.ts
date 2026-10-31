import { waitingOrders } from '../lib/guest-orders';
import { openCalls } from '../lib/calls';
import { listTables } from '../lib/floor';
import { floorApi } from '../lib/floor-api';

// GET /api/floor/tables: the tables with their open bills and the tables calling now (the floor
// view refreshes with it and rings for new calls).
export const GET = floorApi(async ({ db, venue }) => ({
  tables: (await listTables(db, venue.id)).map((t) => ({
    ...t,
    bill: t.bill ? { ...t.bill, openedAt: t.bill.openedAt.toISOString() } : null,
  })),
  calls: await openCalls(db, venue.id),
  orders: await waitingOrders(db, venue.id),
}));
