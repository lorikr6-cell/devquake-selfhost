import { api } from '../lib/api';
import { shareRecipe, unshareRecipe } from '../lib/data';
import { id } from '../lib/validate';

// POST /api/recipes/:id/share: a share link (keeps the current one). Owner only.
export const POST = api(async ({ params, db, user }) => ({
  code: await shareRecipe(db, id(params.id), user.id),
}));

// DELETE /api/recipes/:id/share: stop sharing; people who opened the link lose it.
export const DELETE = api(async ({ params, db, user }) => {
  await unshareRecipe(db, id(params.id), user.id);
});
