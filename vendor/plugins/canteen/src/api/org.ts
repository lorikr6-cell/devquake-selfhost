import { api } from '../lib/api';
import { updateOrg } from '../lib/data';
import { id, orgInput, readBody } from '../lib/validate';

// PATCH /api/orgs/:id { name }: an organiser renames the organisation.
export const PATCH = api(async ({ request, params, db, user }) => {
  await updateOrg(db, id(params.id), user.id, orgInput(await readBody(request)));
});
