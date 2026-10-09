import { api } from '../lib/api';
import { deleteBill, updateBill } from '../lib/data';
import { billInput, id, readBody } from '../lib/validate';

// PATCH /api/bills/:id: the owner corrects the bill. DELETE: the owner deletes it.
export const PATCH = api(async ({ request, params, db, user }) => {
  await updateBill(db, id(params.id), user.id, billInput(await readBody(request)));
});

export const DELETE = api(async ({ params, db, user }) => {
  return { utilityId: await deleteBill(db, id(params.id), user.id) };
});
