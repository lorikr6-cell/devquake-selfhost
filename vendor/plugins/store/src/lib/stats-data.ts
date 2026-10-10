import type { PluginDatabase } from '@devquake/plugin-sdk';
import { change, conversionRate, fillDays, periodDays } from './stats';

// The shop's statistics (ADR 0058): sales from orders (paid, shipped or delivered) and page
// views per product and day. Nothing here is about a person. SQL with ? placeholders only.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const day = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

/** Counts one view of a product page (buyers only; the owner's team is left out by the caller). */
export async function recordView(db: Db, storeId: number, productId: number): Promise<void> {
  await db.execute(
    `INSERT INTO product_views (product_id, store_id, day, views) VALUES (?, ?, UTC_DATE(), 1)
     ON DUPLICATE KEY UPDATE views = views + 1`,
    [productId, storeId],
  );
}

const SOLD = "o.status IN ('paid','shipped','delivered')";

export interface ProductStat {
  productId: number;
  name: string;
  category: string | null;
  published: boolean;
  views: number;
  orders: number;
  units: number;
  revenueCents: number;
  /** Orders per 100 views. */
  conversion: number | null;
  rating: number;
  reviews: number;
  stock: number | null;
}

export interface StoreStats {
  days: string[];
  revenueCents: number;
  orders: number;
  units: number;
  averageCents: number;
  views: number;
  conversion: number | null;
  discountCents: number;
  voucherOrders: number;
  cancelled: number;
  /** Change against the period before, in percent (null without data). */
  changes: { revenue: number | null; orders: number | null; views: number | null };
  daily: { revenueCents: number[]; orders: number[]; views: number[] };
  products: ProductStat[];
  categories: Array<{ category: string | null; revenueCents: number; units: number }>;
  methods: Array<{ method: string; orders: number; revenueCents: number }>;
  subscribers: number;
  buyers: number;
}

export async function storeStats(
  db: Db,
  storeId: number,
  period: number,
  now: Date,
): Promise<StoreStats> {
  const days = periodDays(period, now);
  const from = new Date(`${days[0]}T00:00:00Z`);
  const before = new Date(from.getTime() - period * 86_400_000);

  const [totals] = await db.query<Record<string, unknown>>(
    `SELECT
       COALESCE(SUM(CASE WHEN ${SOLD} AND o.created_at >= ? THEN o.total_cents END), 0) AS revenue,
       COUNT(CASE WHEN ${SOLD} AND o.created_at >= ? THEN 1 END) AS orders,
       COALESCE(SUM(CASE WHEN ${SOLD} AND o.created_at >= ? THEN o.discount_cents END), 0) AS discount,
       COUNT(CASE WHEN ${SOLD} AND o.created_at >= ? AND o.voucher_id IS NOT NULL THEN 1 END) AS voucher_orders,
       COUNT(CASE WHEN o.status = 'cancelled' AND o.created_at >= ? THEN 1 END) AS cancelled,
       COALESCE(SUM(CASE WHEN ${SOLD} AND o.created_at >= ? AND o.created_at < ? THEN o.total_cents END), 0) AS revenue_before,
       COUNT(CASE WHEN ${SOLD} AND o.created_at >= ? AND o.created_at < ? THEN 1 END) AS orders_before
     FROM orders o WHERE o.store_id = ? AND o.created_at >= ?`,
    [from, from, from, from, from, before, from, before, from, storeId, before],
  );

  const dailyOrders = await db.query<{ day: Date | string; revenue: number; orders: number }>(
    `SELECT DATE(o.created_at) AS day, SUM(o.total_cents) AS revenue, COUNT(*) AS orders
     FROM orders o WHERE o.store_id = ? AND ${SOLD} AND o.created_at >= ? GROUP BY DATE(o.created_at)`,
    [storeId, from],
  );
  const dailyViews = await db.query<{ day: Date | string; views: number }>(
    `SELECT day, SUM(views) AS views FROM product_views WHERE store_id = ? AND day >= ? GROUP BY day`,
    [storeId, days[0]],
  );
  const [viewsBefore] = await db.query<{ views: number | null }>(
    'SELECT SUM(views) AS views FROM product_views WHERE store_id = ? AND day >= ? AND day < ?',
    [storeId, before.toISOString().slice(0, 10), days[0]],
  );

  const productRows = await db.query<Record<string, unknown>>(
    `SELECT p.id, p.name, p.category, p.published,
       (SELECT COALESCE(SUM(v.views), 0) FROM product_views v WHERE v.product_id = p.id AND v.day >= ?) AS views,
       (SELECT COUNT(DISTINCT i.order_id) FROM order_items i JOIN orders o ON o.id = i.order_id
          WHERE i.product_id = p.id AND ${SOLD} AND o.created_at >= ?) AS orders,
       (SELECT COALESCE(SUM(i.quantity), 0) FROM order_items i JOIN orders o ON o.id = i.order_id
          WHERE i.product_id = p.id AND ${SOLD} AND o.created_at >= ?) AS units,
       (SELECT COALESCE(SUM(i.quantity * i.unit_cents), 0) FROM order_items i JOIN orders o ON o.id = i.order_id
          WHERE i.product_id = p.id AND ${SOLD} AND o.created_at >= ?) AS revenue,
       (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.status = 'published') AS rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status = 'published') AS reviews,
       (SELECT IF(COUNT(*) = COUNT(va.stock), SUM(GREATEST(va.stock, 0)), NULL) FROM variants va WHERE va.product_id = p.id) AS stock
     FROM products p WHERE p.store_id = ? LIMIT 2000`,
    [days[0], from, from, from, storeId],
  );
  const products: ProductStat[] = productRows
    .map((r) => {
      const views = num(r.views);
      const orders = num(r.orders);
      return {
        productId: num(r.id),
        name: String(r.name),
        category: (r.category as string | null) ?? null,
        published: Boolean(r.published),
        views,
        orders,
        units: num(r.units),
        revenueCents: num(r.revenue),
        conversion: conversionRate(orders, views),
        rating: r.rating === null ? 0 : Math.round(Number(r.rating) * 10) / 10,
        reviews: num(r.reviews),
        stock: r.stock === null || r.stock === undefined ? null : num(r.stock),
      };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents || b.views - a.views);

  const categoryRows = await db.query<{ category: string | null; revenue: number; units: number }>(
    `SELECT p.category, SUM(i.quantity * i.unit_cents) AS revenue, SUM(i.quantity) AS units
     FROM order_items i JOIN orders o ON o.id = i.order_id LEFT JOIN products p ON p.id = i.product_id
     WHERE o.store_id = ? AND ${SOLD} AND o.created_at >= ?
     GROUP BY p.category ORDER BY revenue DESC LIMIT 20`,
    [storeId, from],
  );
  const methodRows = await db.query<{ payment_method: string; orders: number; revenue: number }>(
    `SELECT o.payment_method, COUNT(*) AS orders, SUM(o.total_cents) AS revenue FROM orders o
     WHERE o.store_id = ? AND ${SOLD} AND o.created_at >= ? GROUP BY o.payment_method ORDER BY revenue DESC`,
    [storeId, from],
  );
  const [people] = await db.query<{ subscribers: number; buyers: number }>(
    `SELECT (SELECT COUNT(*) FROM subscribers WHERE store_id = ? AND status = 'confirmed') AS subscribers,
            (SELECT COUNT(*) FROM buyers WHERE store_id = ?) AS buyers`,
    [storeId, storeId],
  );

  const revenueCents = num(totals?.revenue);
  const orders = num(totals?.orders);
  const views = dailyViews.reduce((s, r) => s + num(r.views), 0);
  const units = products.reduce((s, p) => s + p.units, 0);
  return {
    days,
    revenueCents,
    orders,
    units,
    averageCents: orders ? Math.round(revenueCents / orders) : 0,
    views,
    conversion: conversionRate(orders, views),
    discountCents: num(totals?.discount),
    voucherOrders: num(totals?.voucher_orders),
    cancelled: num(totals?.cancelled),
    changes: {
      revenue: change(revenueCents, num(totals?.revenue_before)),
      orders: change(orders, num(totals?.orders_before)),
      views: change(views, num(viewsBefore?.views)),
    },
    daily: {
      revenueCents: fillDays(
        dailyOrders.map((r) => ({ ...r, day: day(r.day) })),
        days,
        (r) => num(r.revenue),
      ),
      orders: fillDays(
        dailyOrders.map((r) => ({ ...r, day: day(r.day) })),
        days,
        (r) => num(r.orders),
      ),
      views: fillDays(
        dailyViews.map((r) => ({ ...r, day: day(r.day) })),
        days,
        (r) => num(r.views),
      ),
    },
    products,
    categories: categoryRows.map((r) => ({
      category: r.category,
      revenueCents: num(r.revenue),
      units: num(r.units),
    })),
    methods: methodRows.map((r) => ({
      method: r.payment_method,
      orders: num(r.orders),
      revenueCents: num(r.revenue),
    })),
    subscribers: num(people?.subscribers),
    buyers: num(people?.buyers),
  };
}
