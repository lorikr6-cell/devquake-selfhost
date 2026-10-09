import { api } from '../lib/api';
import { deletePayment, savePayment } from '../lib/data';
import { id, paymentInput, readBody } from '../lib/validate';

// PUT /api/bills/:id/payments/:userId { amount, method, receivedOn }: the manager confirms what
// a participant paid. Confirmed payments are locked: only a DevQuake administrator can change
// (PUT again) or DELETE them.
export const PUT = api(async ({ request, params, db, user }) => {
  const input = paymentInput(await readBody(request));
  await savePayment(db, id(params.id), user, id(params.userId), input);
});

export const DELETE = api(async ({ params, db, user }) => {
  await deletePayment(db, id(params.id), user, id(params.userId));
});
