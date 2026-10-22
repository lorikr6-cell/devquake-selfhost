import { api } from '../lib/api';
import { deleteOrg, updateOrg } from '../lib/data';
import { id, orgInput, readBody } from '../lib/validate';

// PATCH /api/orgs/:id { name }: an organiser renames the organisation.
export const PATCH = api(async ({ request, params, db, user }) => {
  await updateOrg(db, id(params.id), user.id, orgInput(await readBody(request)));
});

// DELETE /api/orgs/:id { name }: an organiser deletes the organisation with everything in it,
// confirmed by typing its name.
export const DELETE = api(async ({ request, params, db, user }) => {
  const { name } = await readBody(request);
  await deleteOrg(db, id(params.id), user.id, typeof name === 'string' ? name : '');
});
