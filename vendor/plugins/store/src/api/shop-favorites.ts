import { shopApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { favoriteOwner } from '../lib/favorites';
import { removeFavorite } from '../lib/favorites-data';

// DELETE /api/s/:slug/favorites/:id: takes one favourite off the list (ADR 0064), also when its
// product no longer exists. Only the person's own.
export const DELETE = shopApi(
  async ({ db, store, params, ctx, buyer }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'notFound');
    const owner = favoriteOwner(ctx.user?.id, ctx.user ? null : (await buyer())?.id);
    if (!owner) throw new HttpError(401, 'favoriteSignIn');
    await removeFavorite(db, store.id, owner, id);
  },
  { limit: 60, sameSite: true },
);
