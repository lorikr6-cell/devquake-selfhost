import { billView } from '../lib/bill-view';
import { openBill } from '../lib/floor';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// POST /api/floor/tables/:id/bill: opens a bill on the table (or gives the open one).
export const POST = floorApi(async ({ params, db, venue, actor }) => {
  const bill = await openBill(db, venue.id, Number(params.id), actor.name);
  if (!bill) throw new HttpError(404, 'notFound');
  return { bill: billView(bill, venue) };
});
