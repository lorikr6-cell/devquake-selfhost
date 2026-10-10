import { api, mine } from '../lib/api';
import { updatePayments } from '../lib/data';
import { canKeepSecrets } from '../lib/secrets';
import { paymentsInput, readBody } from '../lib/validate';

// PUT /api/store/payments: the payment methods. Secrets are stored encrypted and never sent
// back; a secret left out keeps the stored one, an empty one removes it.
export const PUT = api('payments', async ({ request, db, store }) => {
  await updatePayments(
    db,
    mine(store).id,
    paymentsInput(await readBody(request), canKeepSecrets()),
  );
});
