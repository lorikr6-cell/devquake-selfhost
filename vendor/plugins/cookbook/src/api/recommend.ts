import { api } from '../lib/api';
import { setRecommendation } from '../lib/data';
import { id, readBody } from '../lib/validate';

// POST /api/recipes/:id/recommend { on }: recommend someone else's public recipe, or take it back.
export const POST = api(async ({ request, params, db, user }) => {
  const { on } = await readBody(request);
  return { recommendations: await setRecommendation(db, id(params.id), user.id, on === true) };
});
