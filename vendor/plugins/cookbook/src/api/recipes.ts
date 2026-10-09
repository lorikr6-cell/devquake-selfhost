import { api } from '../lib/api';
import { createRecipe } from '../lib/data';
import { readBody, recipeInput } from '../lib/validate';

// POST /api/recipes { title, servings, ingredients, steps, … }: a new own recipe (private).
export const POST = api(async ({ request, db, user }) => {
  const input = recipeInput(await readBody(request));
  return { id: await createRecipe(db, user, input) };
});
