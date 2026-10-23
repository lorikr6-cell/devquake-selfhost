import { api } from '../lib/api';
import { searchRecipes } from '../lib/dishes-data';
import { id } from '../lib/validate';

// GET /api/orgs/:id/recipes?q=: recipes in the visitor's Cookbook, to pick as dishes.
export const GET = api(async ({ request, params, db, user, links }) => ({
  recipes: await searchRecipes(
    db,
    id(params.id),
    user.id,
    links,
    new URL(request.url).searchParams.get('q') ?? '',
  ),
}));
