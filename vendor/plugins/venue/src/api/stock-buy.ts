import { jsonBody, ownerApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { venueLink } from '../lib/links';
import { ingredientsOf, toBuy } from '../lib/stock';

// POST /api/stock/buy { level: 'daily' | 'weekly' }: what is below that level goes onto the
// venue's purchasing list in Shopping (ADR 0035), up to the level, at most 30 lines.
export const POST = ownerApi(async ({ request, db, venue, ctx }) => {
  const level = (await jsonBody(request)).level === 'weekly' ? 'weekly' : 'daily';
  const list = await venueLink(db, venue.id, 'shoppingList');
  if (!list) throw new HttpError(409, 'noShoppingList');
  if (!ctx.links) throw new HttpError(409, 'notConnected');
  const lines = toBuy(await ingredientsOf(db, venue.id), level).slice(0, 30);
  if (!lines.length) throw new HttpError(409, 'nothingToBuy');
  const r = await ctx.links.call<{ added?: number }>('shopping', 'list.add-items', {
    listId: Number(list.ref),
    items: lines.map((l) => ({
      name: l.ingredient.name,
      quantity: l.qty,
      unit: l.ingredient.unit,
    })),
  });
  if (!r.ok) throw new HttpError(409, 'notConnected');
  return { added: lines.length, list: list.name };
});
