import { api } from '../lib/api';
import { deleteHousehold, updateHousehold } from '../lib/data';
import { id, readBody, settingsInput } from '../lib/validate';

// PATCH /api/households/:id { name, diet, avoid, dislikes, kcalTarget, proteinTarget }: planners.
export const PATCH = api(async ({ request, params, db, user, timeZone }) => {
  const settings = settingsInput(await readBody(request));
  await updateHousehold(db, id(params.id), user.id, settings, timeZone);
});

// DELETE /api/households/:id: its creator deletes it with its plan.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteHousehold(db, id(params.id), user.id);
});
