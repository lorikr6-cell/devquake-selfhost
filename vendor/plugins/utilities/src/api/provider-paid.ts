import { api } from '../lib/api';
import { setProviderPaid } from '../lib/data';
import { bool, id, readBody } from '../lib/validate';

// PUT /api/bills/:id/provider-paid { paid }: the owner has paid the provider (or not yet).
export const PUT = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await setProviderPaid(db, id(params.id), user.id, bool(body.paid));
});
