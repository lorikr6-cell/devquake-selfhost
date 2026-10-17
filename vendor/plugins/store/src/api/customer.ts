import { api, mine } from '../lib/api';
import { CUSTOMER_KEY, deleteCustomer, forgetMember, setBlocked } from '../lib/customers-data';
import { HttpError } from '../lib/http';
import { canManageCustomers } from '../lib/roles';
import { readBody } from '../lib/validate';

function target(key: string | undefined) {
  if (!key || !CUSTOMER_KEY.test(key)) throw new HttpError(404, 'notFound');
  return { kind: key[0] as 'b' | 'u', id: Number(key.slice(1)) };
}

// PATCH /api/customers/:key { blocked: boolean }: blocks or unblocks a buyer account (ADR 0064).
export const PATCH = api('customers', async ({ request, params, db, store, roles }) => {
  if (!canManageCustomers(roles)) throw new HttpError(403, 'forbidden');
  const { kind, id } = target(params.key);
  if (kind !== 'b') throw new HttpError(400, 'invalidRequest');
  const { blocked } = await readBody(request);
  if (typeof blocked !== 'boolean') throw new HttpError(400, 'invalidRequest');
  if (!(await setBlocked(db, mine(store).id, id, blocked))) throw new HttpError(404, 'notFound');
});

// DELETE /api/customers/:key: deletes a buyer account (orders stay), or takes a member's votes
// and favourites out of the shop.
export const DELETE = api('customers', async ({ params, db, store, roles }) => {
  if (!canManageCustomers(roles)) throw new HttpError(403, 'forbidden');
  const { kind, id } = target(params.key);
  if (kind === 'b') await deleteCustomer(db, mine(store).id, id);
  else await forgetMember(db, mine(store).id, id);
});
