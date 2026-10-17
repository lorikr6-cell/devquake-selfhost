import { shopApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { listProducts } from '../lib/data';
import { favoriteOwner } from '../lib/favorites';
import { addFavorite, isBlocked, removeFavoriteProduct } from '../lib/favorites-data';

/** The product and who saves it: a DevQuake member or the shop's signed-in buyer (ADR 0064). */
async function target(scope: Parameters<Parameters<typeof shopApi>[0]>[0]) {
  const { db, store, params, ctx, buyer } = scope;
  const [product] = await listProducts(db, store.id, {
    publishedOnly: true,
    slugs: [params.product ?? ''],
  });
  if (!product) throw new HttpError(404, 'productNotFound');
  const owner = favoriteOwner(ctx.user?.id, ctx.user ? null : (await buyer())?.id);
  if (!owner) throw new HttpError(401, 'favoriteSignIn');
  if (await isBlocked(db, store.id, owner)) throw new HttpError(403, 'blocked');
  return { product, owner };
}

// POST /api/s/:slug/p/:product/favorite: saves the product with its price now.
export const POST = shopApi(
  async (scope) => {
    const { product, owner } = await target(scope);
    if (!(await addFavorite(scope.db, scope.store.id, owner, product))) {
      throw new HttpError(409, 'favoritesFull');
    }
    return { favorite: true };
  },
  { limit: 60, sameSite: true },
);

// DELETE /api/s/:slug/p/:product/favorite: takes it off the favourites.
export const DELETE = shopApi(
  async (scope) => {
    const { product, owner } = await target(scope);
    await removeFavoriteProduct(scope.db, scope.store.id, owner, product.id);
    return { favorite: false };
  },
  { limit: 60, sameSite: true },
);
