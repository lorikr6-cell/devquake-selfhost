import { api, mine } from '../lib/api';
import { createVoucher } from '../lib/marketing-data';
import { readBody, voucherInput } from '../lib/validate';

// POST /api/vouchers { code, description, kind, percentOff, amount, minOrder, maxUses,
// oncePerBuyer, startsAt, endsAt, active }
export const POST = api('marketing', async ({ request, db, store, timeZone }) => {
  const id = await createVoucher(
    db,
    mine(store).id,
    voucherInput(await readBody(request), timeZone),
  );
  return { id };
});
