import { jsonBody, ownerApi } from '../lib/api';
import { setGuestOrders } from '../lib/data';

// PUT /api/venue/guest-orders { on }: whether guests may order from the table (the owner's
// setting; the waiter confirms each order). Saves itself (rule 13).
export const PUT = ownerApi(async ({ request, db, venue }) => {
  const on = (await jsonBody(request)).on === true;
  await setGuestOrders(db, venue.id, on);
  return { on };
});
