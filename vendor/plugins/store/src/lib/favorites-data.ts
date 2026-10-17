import type { PluginDatabase } from '@devquake/plugin-sdk';
import { listProducts, type ProductSummary } from './data';
import { FAVORITES_LIMIT, favoriteView, type FavoriteView, type SavedFavorite } from './favorites';

// Favourites (ADR 0064): saving, removing and listing a person's saved products with today's
// state. SQL with ? placeholders only; every query names the store.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v ?? ''));

/**
 * A person blocked by the owner: their buyer account ('b<id>'), or the buyer account a DevQuake
 * member connected ('u<id>').
 */
export async function isBlocked(db: Db, storeId: number, key: string): Promise<boolean> {
  const id = Number(key.slice(1));
  if (!Number.isInteger(id) || id <= 0) return false;
  const column = key.startsWith('u') ? 'platform_user_id' : 'id';
  const [r] = await db.query<{ n: number }>(
    // sql-safe: column — one of two fixed names above
    `SELECT COUNT(*) AS n FROM buyers WHERE store_id = ? AND ${column} = ? AND blocked_at IS NOT NULL`,
    [storeId, id],
  );
  return num(r?.n) > 0;
}

/** Saves a product at its price now. False when the list is full. */
export async function addFavorite(
  db: Db,
  storeId: number,
  owner: string,
  product: Pick<ProductSummary, 'id' | 'name' | 'slug' | 'fromCents'>,
): Promise<boolean> {
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM favorites WHERE store_id = ? AND owner_key = ?',
    [storeId, owner],
  );
  if (num(count?.n) >= FAVORITES_LIMIT) return false;
  // Saving again keeps the first date and price: the difference stays honest.
  await db.execute(
    `INSERT IGNORE INTO favorites (store_id, product_id, owner_key, product_name, product_slug, price_cents)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [storeId, product.id, owner, product.name, product.slug, product.fromCents],
  );
  return true;
}

export async function removeFavorite(
  db: Db,
  storeId: number,
  owner: string,
  favoriteId: number,
): Promise<void> {
  await db.execute('DELETE FROM favorites WHERE id = ? AND store_id = ? AND owner_key = ?', [
    favoriteId,
    storeId,
    owner,
  ]);
}

export async function removeFavoriteProduct(
  db: Db,
  storeId: number,
  owner: string,
  productId: number,
): Promise<void> {
  await db.execute(
    'DELETE FROM favorites WHERE store_id = ? AND owner_key = ? AND product_id = ?',
    [storeId, owner, productId],
  );
}

export async function isFavorite(
  db: Db,
  storeId: number,
  owner: string,
  productId: number,
): Promise<boolean> {
  const [r] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM favorites WHERE store_id = ? AND owner_key = ? AND product_id = ?',
    [storeId, owner, productId],
  );
  return num(r?.n) > 0;
}

async function saved(db: Db, storeId: number, owner: string): Promise<SavedFavorite[]> {
  const rows = await db.query<{
    id: number;
    product_id: number | null;
    product_name: string;
    product_slug: string;
    price_cents: number;
    created_at: Date;
  }>(
    // sql-safe: FAVORITES_LIMIT — a number constant
    `SELECT id, product_id, product_name, product_slug, price_cents, created_at FROM favorites
      WHERE store_id = ? AND owner_key = ? ORDER BY created_at DESC, id DESC LIMIT ${FAVORITES_LIMIT}`,
    [storeId, owner],
  );
  return rows.map((r) => ({
    id: num(r.id),
    productId: r.product_id == null ? null : num(r.product_id),
    name: r.product_name,
    slug: r.product_slug,
    priceCents: num(r.price_cents),
    addedAt: iso(r.created_at),
  }));
}

/** A person's favourites, newest first, each with today's availability and price. */
export async function favoritesOf(db: Db, storeId: number, owner: string): Promise<FavoriteView[]> {
  const list = await saved(db, storeId, owner);
  const ids = list.flatMap((f) => (f.productId ? [f.productId] : []));
  const products = ids.length ? await listProducts(db, storeId, { publishedOnly: false, ids }) : [];
  const byId = new Map(products.map((p) => [p.id, p]));
  return list.map((f) => favoriteView(f, f.productId ? (byId.get(f.productId) ?? null) : null));
}

/** How many people saved each product (for the owner's customer overview). */
export async function favoritesCountOf(db: Db, storeId: number, owner: string): Promise<number> {
  const [r] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM favorites WHERE store_id = ? AND owner_key = ?',
    [storeId, owner],
  );
  return num(r?.n);
}
