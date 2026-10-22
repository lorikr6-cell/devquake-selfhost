import { api } from '../lib/api';
import { changeRole, removeStaff } from '../lib/data';
import { HttpError } from '../lib/http';
import { isRole } from '../lib/roles';
import { id, readBody } from '../lib/validate';

// PATCH /api/orgs/:id/staff/:staffId { role }: an organiser changes someone's role.
export const PATCH = api(async ({ request, params, db, user }) => {
  const { role } = await readBody(request);
  if (!isRole(role)) throw new HttpError(400, 'invalidRequest');
  await changeRole(db, id(params.id), id(params.staffId), user.id, role);
});

// DELETE …: an organiser removes someone from the staff (never the last organiser).
export const DELETE = api(async ({ params, db, user }) => {
  await removeStaff(db, id(params.id), id(params.staffId), user.id);
});
