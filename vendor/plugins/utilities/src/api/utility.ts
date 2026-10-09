import { api } from '../lib/api';
import { deleteUtility, updateUtility } from '../lib/data';
import { id, readBody, utilityInput } from '../lib/validate';

// PATCH /api/utilities/:id: the owner changes the settings. DELETE: deletes it for everyone.
export const PATCH = api(async ({ request, params, db, user }) => {
  await updateUtility(db, id(params.id), user.id, utilityInput(await readBody(request)));
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteUtility(db, id(params.id), user.id);
});
