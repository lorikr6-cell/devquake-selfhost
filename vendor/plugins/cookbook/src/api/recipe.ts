import { api } from '../lib/api';
import { deleteRecipe, updateRecipe } from '../lib/data';
import { id, readBody, recipeInput } from '../lib/validate';

// PUT /api/recipes/:id { … }: the owner changes the recipe (ingredients and steps replaced).
export const PUT = api(async ({ request, params, db, user }) => {
  const input = recipeInput(await readBody(request));
  await updateRecipe(db, id(params.id), user.id, input);
});

// DELETE /api/recipes/:id: the owner deletes it (with its photo and share link).
export const DELETE = api(async ({ params, db, user }) => {
  await deleteRecipe(db, id(params.id), user.id);
});
