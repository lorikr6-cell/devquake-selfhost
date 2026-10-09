import { api } from '../lib/api';
import { searchRecipes } from '../lib/cookbook';
import { requireMember } from '../lib/data';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// GET /api/recipes?household=&q=: cookbook recipes for the meal search box (the household's
// allergens left out), through the cookbook's recipes.search link point.
export const GET = api(async ({ request, db, user, links }) => {
  const url = new URL(request.url);
  const { household } = await requireMember(db, id(url.searchParams.get('household')), user.id);
  const recipes = await searchRecipes(links, {
    query: (url.searchParams.get('q') ?? '').slice(0, 60),
    without: household.avoid,
    limit: 12,
  });
  if (!recipes) throw new HttpError(502, 'cookbookFailed');
  return { recipes };
});
