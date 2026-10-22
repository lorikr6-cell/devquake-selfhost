import { api } from '../lib/api';
import { createInvite } from '../lib/data';
import { HttpError } from '../lib/http';
import { isRole } from '../lib/roles';
import { id, readBody } from '../lib/validate';

// POST /api/orgs/:id/invites { role }: an organiser makes a one-time link for one person.
export const POST = api(async ({ request, params, db, user }) => {
  const { role } = await readBody(request);
  if (!isRole(role)) throw new HttpError(400, 'invalidRequest');
  return { code: await createInvite(db, id(params.id), user.id, role) };
});
