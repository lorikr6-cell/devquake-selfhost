import { listTables } from '../lib/floor';
import { floorApi } from '../lib/floor-api';

// GET /api/floor/tables: the tables with their open bills (the floor view refreshes with it).
export const GET = floorApi(async ({ db, venue }) => ({
  tables: (await listTables(db, venue.id)).map((t) => ({
    ...t,
    bill: t.bill ? { ...t.bill, openedAt: t.bill.openedAt.toISOString() } : null,
  })),
}));
