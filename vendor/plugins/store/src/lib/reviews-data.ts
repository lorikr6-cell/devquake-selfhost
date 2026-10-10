import type { PluginDatabase } from '@devquake/plugin-sdk';
import { HttpError } from './http';
import { summarize, type RatingSummary, type ReviewStatus } from './reviews';

// Ratings and comments (ADR 0058). SQL with ? placeholders only; every query names the store.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

export interface Review {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  verified: boolean;
  status: ReviewStatus;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

const SELECT = `SELECT r.*, p.name AS product_name, p.slug AS product_slug
  FROM reviews r JOIN products p ON p.id = r.product_id`;

const toReview = (r: Record<string, unknown>): Review => ({
  id: num(r.id),
  productId: num(r.product_id),
  productName: String(r.product_name),
  productSlug: String(r.product_slug),
  rating: num(r.rating),
  title: (r.title as string | null) ?? null,
  body: (r.body as string | null) ?? null,
  author: String(r.author),
  verified: Boolean(r.verified),
  status: r.status as ReviewStatus,
  reply: (r.reply as string | null) ?? null,
  repliedAt: iso(r.replied_at),
  createdAt: iso(r.created_at) ?? '',
});

/** A product's published reviews (newest first) and the summary of their ratings. */
export async function productReviews(
  db: Db,
  storeId: number,
  productId: number,
  limit = 50,
): Promise<{ reviews: Review[]; summary: RatingSummary }> {
  const ratings = await db.query<{ rating: number }>(
    "SELECT rating FROM reviews WHERE store_id = ? AND product_id = ? AND status = 'published'",
    [storeId, productId],
  );
  const rows = await db.query<Record<string, unknown>>(
    `${SELECT} WHERE r.store_id = ? AND r.product_id = ? AND r.status = 'published'
     ORDER BY r.created_at DESC LIMIT ${Math.min(200, Math.max(1, limit))}`,
    [storeId, productId],
  );
  return { reviews: rows.map(toReview), summary: summarize(ratings.map((r) => num(r.rating))) };
}

/** The owner's list: by status, newest first. */
export async function storeReviews(
  db: Db,
  storeId: number,
  status: ReviewStatus | null,
): Promise<Review[]> {
  const rows = await db.query<Record<string, unknown>>(
    `${SELECT} WHERE r.store_id = ? ${status ? 'AND r.status = ?' : ''}
     ORDER BY r.created_at DESC LIMIT 300`,
    status ? [storeId, status] : [storeId],
  );
  return rows.map(toReview);
}

export async function pendingReviews(db: Db, storeId: number): Promise<number> {
  const [r] = await db.query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM reviews WHERE store_id = ? AND status = 'pending'",
    [storeId],
  );
  return num(r?.n);
}

export interface NewReview {
  storeId: number;
  productId: number;
  orderId: number | null;
  rating: number;
  title: string | null;
  body: string | null;
  author: string;
  verified: boolean;
  status: ReviewStatus;
}

export async function addReview(db: Db, review: NewReview): Promise<number> {
  try {
    const res = await db.execute(
      `INSERT INTO reviews (store_id, product_id, order_id, rating, title, body, author, verified, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        review.storeId,
        review.productId,
        review.orderId,
        review.rating,
        review.title,
        review.body,
        review.author,
        review.verified ? 1 : 0,
        review.status,
      ],
    );
    return res.insertId;
  } catch (err) {
    // One review per product of an order.
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') throw new HttpError(409, 'reviewed');
    throw err;
  }
}

/** The products of an order its buyer already reviewed. */
export async function reviewedProducts(db: Db, orderId: number): Promise<number[]> {
  const rows = await db.query<{ product_id: number }>(
    'SELECT product_id FROM reviews WHERE order_id = ?',
    [orderId],
  );
  return rows.map((r) => num(r.product_id));
}

export async function moderateReview(
  db: Db,
  storeId: number,
  id: number,
  change: { status?: ReviewStatus; reply?: string | null },
): Promise<void> {
  const [found] = await db.query<{ id: number }>(
    'SELECT id FROM reviews WHERE id = ? AND store_id = ?',
    [id, storeId],
  );
  if (!found) throw new HttpError(404, 'notFound');
  if (change.status) {
    await db.execute('UPDATE reviews SET status = ? WHERE id = ?', [change.status, id]);
  }
  if (change.reply !== undefined) {
    await db.execute(
      'UPDATE reviews SET reply = ?, replied_at = IF(? IS NULL, NULL, UTC_TIMESTAMP()) WHERE id = ?',
      [change.reply, change.reply, id],
    );
  }
}

export async function deleteReview(db: Db, storeId: number, id: number): Promise<void> {
  const res = await db.execute('DELETE FROM reviews WHERE id = ? AND store_id = ?', [id, storeId]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}
