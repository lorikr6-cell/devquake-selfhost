import { api, mine } from '../lib/api';
import { deleteVoucher, updateVoucher } from '../lib/marketing-data';
import { id, readBody, voucherInput } from '../lib/validate';

export const PUT = api('marketing', async ({ request, params, db, store, timeZone }) => {
  await updateVoucher(
    db,
    mine(store).id,
    id(params.id),
    voucherInput(await readBody(request), timeZone),
  );
});

// DELETE /api/vouchers/:id: orders keep the code they used.
export const DELETE = api('marketing', async ({ params, db, store }) => {
  await deleteVoucher(db, mine(store).id, id(params.id));
});
