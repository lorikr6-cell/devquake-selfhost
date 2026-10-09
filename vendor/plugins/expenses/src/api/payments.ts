import { api } from '../lib/api';
import { createPayment } from '../lib/data';
import { id, paymentInput, readBody } from '../lib/validate';

// POST /api/groups/:id/payments { from, to, amount, paidOn, note }: someone paid someone back.
export const POST = api(async ({ request, params, db, user }) => {
  const paymentId = await createPayment(
    db,
    id(params.id),
    user.id,
    paymentInput(await readBody(request)),
  );
  return { id: paymentId };
});
