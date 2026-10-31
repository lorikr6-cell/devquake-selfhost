import { billView } from '../lib/bill-view';
import { waiterFor } from '../lib/calls';
import { openBill } from '../lib/floor';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';

// POST /api/floor/tables/:id/bill: opens a bill on the table (or gives the open one). A waiter
// opening it looks after it; otherwise the table's section waiter on shift, or the least busy.
export const POST = floorApi(async ({ params, db, venue, actor }) => {
  const tableId = Number(params.id);
  const waiter =
    actor.staffId && (actor.role === 'waiter' || actor.role === 'manager')
      ? { id: actor.staffId, name: actor.name }
      : await waiterFor(db, venue.id, tableId);
  const bill = await openBill(db, venue.id, tableId, actor.name, waiter);
  if (!bill) throw new HttpError(404, 'notFound');
  return { bill: billView(bill, venue) };
});
