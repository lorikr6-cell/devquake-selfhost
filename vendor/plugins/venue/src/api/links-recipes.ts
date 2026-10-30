import { ownerApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { recipeAsItem, searchRecipes } from '../lib/links';

// From the cookbook (ADR 0035): GET ?q= searches the member's recipes; GET ?ref= gives one as a
// menu item to fill in (name, ingredients, allergens). Needs the two apps connected.
export const GET = ownerApi(async ({ request, ctx }) => {
  if (!ctx.links) throw new HttpError(409, 'notConnected');
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref');
  if (ref) {
    const item = await recipeAsItem(ctx.links, ref.slice(0, 40));
    if (!item) throw new HttpError(404, 'notFound');
    return { item };
  }
  const recipes = await searchRecipes(ctx.links, (url.searchParams.get('q') ?? '').slice(0, 60));
  if (!recipes) throw new HttpError(409, 'notConnected');
  return { recipes };
});
