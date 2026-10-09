import { api } from '../lib/api';
import { deletePayment } from '../lib/data';
import { id } from '../lib/validate';

// DELETE /api/groups/:id/payments/:paymentId
export const DELETE = api(async ({ params, db, user }) => {
  await deletePayment(db, id(params.id), id(params.paymentId), user.id);
});
