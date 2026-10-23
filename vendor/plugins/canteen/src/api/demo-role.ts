import { api } from '../lib/api';
import { switchDemoRole } from '../lib/demo';
import { id, readBody } from '../lib/validate';

// PUT /api/orgs/:id/demo-role { role }: the maker of a demo organisation views it in that role.
export const PUT = api(async ({ request, params, db, user }) => {
  const { role } = await readBody(request);
  await switchDemoRole(db, id(params.id), user.id, role);
  return { ok: true };
});
