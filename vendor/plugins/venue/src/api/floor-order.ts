import { jsonBody } from '../lib/api';
import { floorApi } from '../lib/floor-api';
import { answerOrder, waitingOrders } from '../lib/guest-orders';
import { HttpError } from '../lib/http';

// PUT /api/floor/orders/:id { confirm: boolean }: the waiter confirms a guest's order (it goes
// onto the table's bill and to the kitchen and bar) or refuses it. Items that ran short meanwhile
// are left out and named in `skipped`.
export const PUT = floorApi(async ({ request, params, db, venue, actor }) => {
  const confirm = (await jsonBody(request)).confirm === true;
  const result = await answerOrder(db, venue.id, Number(params.id), confirm, {
    name: actor.name,
    staffId: actor.staffId,
  });
  if (!result) throw new HttpError(409, 'orderAnswered');
  return { orders: await waitingOrders(db, venue.id), skipped: result.skipped };
});
