// Favourites (ADR 0064): what a saved product looks like today. Pure, so it is tested; the
// database side is favorites-data.ts.

/** How many favourites one person may keep in one shop. */
export const FAVORITES_LIMIT = 200;

/** A saved product as stored: the price and name when it was saved. */
export interface SavedFavorite {
  id: number;
  productId: number | null;
  name: string;
  slug: string;
  priceCents: number;
  addedAt: string;
}

/** The product as the shop shows it now (null: deleted). */
export interface FavoriteProductNow {
  name: string;
  slug: string;
  published: boolean;
  interest: boolean;
  fromCents: number;
  /** Stock across options; null when not counted. */
  stock: number | null;
  photoId: number | null;
}

/**
 * 'available': it can be ordered. 'soldOut': still listed, but none left. 'gone': deleted, no
 * longer published, or only in an interest vote; shown struck through.
 */
export type FavoriteState = 'available' | 'soldOut' | 'gone';

export interface FavoriteView extends SavedFavorite {
  state: FavoriteState;
  /** Today's lowest price, when it is still listed. */
  nowCents: number | null;
  /** Today's price minus the saved one: negative is cheaper now. Null when not listed. */
  diffCents: number | null;
  photoId: number | null;
}

export function favoriteView(saved: SavedFavorite, now: FavoriteProductNow | null): FavoriteView {
  if (!now || !now.published || now.interest) {
    return {
      ...saved,
      state: 'gone',
      nowCents: null,
      diffCents: null,
      photoId: now?.photoId ?? null,
    };
  }
  return {
    ...saved,
    // The current name and address (the owner may have renamed it).
    name: now.name,
    slug: now.slug,
    state: now.stock === 0 ? 'soldOut' : 'available',
    nowCents: now.fromCents,
    diffCents: now.fromCents - saved.priceCents,
    photoId: now.photoId,
  };
}

/** The owner key of a favourite: a DevQuake member first, else the shop's buyer. */
export function favoriteOwner(
  userId: number | null | undefined,
  buyerId: number | null | undefined,
): string | null {
  if (userId) return `u${userId}`;
  if (buyerId) return `b${buyerId}`;
  return null;
}
