import { api, mine } from '../lib/api';
import { setOrderStatus, setTracking } from '../lib/data';
import { HttpError } from '../lib/http';
import { ORDER_STATUSES, type OrderStatus } from '../lib/model';
import { id, readBody, trackingInput } from '../lib/validate';

// PATCH /api/orders/:id { status } moves the order on; { tracking: { carrier, number, url } }
// sets how it is shipped.
export const PATCH = api('orders', async ({ request, params, db, store }) => {
  const storeId = mine(store).id;
  const orderId = id(params.id);
  const body = await readBody(request);
  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status as OrderStatus))
      throw new HttpError(400, 'invalidRequest');
    await setOrderStatus(db, storeId, orderId, body.status as OrderStatus);
  }
  if (body.tracking !== undefined) {
    await setTracking(
      db,
      storeId,
      orderId,
      trackingInput((body.tracking ?? {}) as Record<string, unknown>),
    );
  }
});
