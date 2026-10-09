import { api } from '../lib/api';
import { deleteGroup, updateGroup } from '../lib/data';
import { groupInput, id, readBody } from '../lib/validate';

// PATCH /api/groups/:id { name, kind, currency }: the owner changes the group.
export const PATCH = api(async ({ request, params, db, user }) => {
  await updateGroup(db, id(params.id), user.id, groupInput(await readBody(request)));
});

// DELETE /api/groups/:id: the owner deletes the group with everything in it.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteGroup(db, id(params.id), user.id);
});
