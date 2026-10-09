import { api } from '../lib/api';
import { deleteSet, updateSet } from '../lib/data';
import { LIMITS } from '../lib/plan';
import { id, optionalText, readBody, requiredText } from '../lib/validate';

// PATCH /api/sets/:id { title, description }: the owner renames it.
export const PATCH = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  await updateSet(db, id(params.id), user.id, {
    title: requiredText(body.title, 'mealTitle', LIMITS.mealTitle),
    description: optionalText(body.description, 'description', LIMITS.description),
  });
});

// DELETE /api/sets/:id: the owner deletes it (planned copies stay in the plans).
export const DELETE = api(async ({ params, db, user }) => {
  await deleteSet(db, id(params.id), user.id);
});
