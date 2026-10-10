import type { PluginDatabase } from '@devquake/plugin-sdk';
import { methodsOf, zonesOf, type Store } from './data';
import { shopMailConfigured } from './mailer';
import type { OrderStatus, PaymentMethod } from './model';
import type { TaskPanel } from './roles';

// The Overview's task board (ADR 0058): for each role, what waits for it and how the shop
// stands in its area. Counts and short lists only; the pages hold the rest.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : '');

export interface ShippingTasks {
  toShip: number;
  inTransit: number;
  zones: number;
  orders: Array<{
    id: number;
    buyerName: string;
    country: string;
    method: PaymentMethod;
    status: OrderStatus;
    createdAt: string;
  }>;
}

export interface SupportTasks {
  unread: number;
  open: number;
  pendingReviews: number;
  threads: Array<{ id: number; subject: string; buyer: string; lastAt: string }>;
  reviews: Array<{ id: number; productName: string; rating: number; author: string }>;
}

export interface CatalogTasks {
  soldOut: number;
  lowStock: number;
  drafts: number;
  noPhoto: number;
  products: Array<{ id: number; name: string; stock: number }>;
}

export interface MarketingTasks {
  liveCampaigns: Array<{ id: number; name: string; percentOff: number; endsAt: string | null }>;
  scheduledCampaigns: number;
  liveVouchers: number;
  usedUpVouchers: number;
  liveRules: number;
  draftNewsletters: number;
  sendingNewsletters: number;
  subscribers: number;
}

export interface MaintenanceTasks {
  checks: Array<{ key: string; ok: boolean; href: string }>;
  maintenance: boolean;
  published: boolean;
}

export interface TaskBoard {
  shipping?: ShippingTasks;
  support?: SupportTasks;
  catalog?: CatalogTasks;
  marketing?: MarketingTasks;
  maintenance?: MaintenanceTasks;
}

async function shipping(db: Db, storeId: number): Promise<ShippingTasks> {
  // Paid orders to ship, and cash-on-delivery orders that ship before they are paid.
  const waiting =
    "(o.status = 'paid' OR (o.status = 'awaiting_payment' AND o.payment_method = 'cod'))";
  const [counts] = await db.query<Record<string, unknown>>(
    `SELECT (SELECT COUNT(*) FROM orders o WHERE o.store_id = ? AND ${waiting}) AS to_ship,
            (SELECT COUNT(*) FROM orders o WHERE o.store_id = ? AND o.status = 'shipped') AS in_transit`,
    [storeId, storeId],
  );
  const rows = await db.query<Record<string, unknown>>(
    `SELECT o.id, o.buyer_name, o.country, o.payment_method, o.status, o.created_at FROM orders o
     WHERE o.store_id = ? AND ${waiting} ORDER BY o.id LIMIT 8`,
    [storeId],
  );
  return {
    toShip: num(counts?.to_ship),
    inTransit: num(counts?.in_transit),
    zones: (await zonesOf(db, storeId)).length,
    orders: rows.map((r) => ({
      id: num(r.id),
      buyerName: String(r.buyer_name),
      country: String(r.country),
      method: r.payment_method as PaymentMethod,
      status: r.status as OrderStatus,
      createdAt: iso(r.created_at),
    })),
  };
}

async function support(db: Db, storeId: number): Promise<SupportTasks> {
  const [counts] = await db.query<Record<string, unknown>>(
    `SELECT (SELECT COUNT(*) FROM threads WHERE store_id = ? AND shop_read = 0) AS unread,
            (SELECT COUNT(*) FROM threads WHERE store_id = ? AND status = 'open') AS open_threads,
            (SELECT COUNT(*) FROM reviews WHERE store_id = ? AND status = 'pending') AS pending`,
    [storeId, storeId, storeId],
  );
  const threads = await db.query<Record<string, unknown>>(
    `SELECT th.id, th.subject, th.last_at, COALESCE(b.name, b.email) AS buyer
     FROM threads th JOIN buyers b ON b.id = th.buyer_id
     WHERE th.store_id = ? AND th.shop_read = 0 ORDER BY th.last_at LIMIT 5`,
    [storeId],
  );
  const reviews = await db.query<Record<string, unknown>>(
    `SELECT r.id, r.rating, r.author, p.name AS product_name FROM reviews r JOIN products p ON p.id = r.product_id
     WHERE r.store_id = ? AND r.status = 'pending' ORDER BY r.created_at LIMIT 5`,
    [storeId],
  );
  return {
    unread: num(counts?.unread),
    open: num(counts?.open_threads),
    pendingReviews: num(counts?.pending),
    threads: threads.map((r) => ({
      id: num(r.id),
      subject: String(r.subject),
      buyer: String(r.buyer),
      lastAt: iso(r.last_at),
    })),
    reviews: reviews.map((r) => ({
      id: num(r.id),
      productName: String(r.product_name),
      rating: num(r.rating),
      author: String(r.author),
    })),
  };
}

async function catalog(db: Db, storeId: number): Promise<CatalogTasks> {
  const [counts] = await db.query<Record<string, unknown>>(
    `SELECT
       (SELECT COUNT(DISTINCT v.product_id) FROM variants v WHERE v.store_id = ? AND v.stock IS NOT NULL AND v.stock <= 0) AS sold_out,
       (SELECT COUNT(DISTINCT v.product_id) FROM variants v WHERE v.store_id = ? AND v.stock BETWEEN 1 AND 5) AS low_stock,
       (SELECT COUNT(*) FROM products WHERE store_id = ? AND published = 0) AS drafts,
       (SELECT COUNT(*) FROM products p WHERE p.store_id = ? AND NOT EXISTS (SELECT 1 FROM product_photos ph WHERE ph.product_id = p.id)) AS no_photo`,
    [storeId, storeId, storeId, storeId],
  );
  const rows = await db.query<Record<string, unknown>>(
    `SELECT p.id, p.name, MIN(v.stock) AS stock FROM products p JOIN variants v ON v.product_id = p.id
     WHERE p.store_id = ? AND v.stock IS NOT NULL AND v.stock <= 5
     GROUP BY p.id, p.name ORDER BY stock, p.name LIMIT 8`,
    [storeId],
  );
  return {
    soldOut: num(counts?.sold_out),
    lowStock: num(counts?.low_stock),
    drafts: num(counts?.drafts),
    noPhoto: num(counts?.no_photo),
    products: rows.map((r) => ({ id: num(r.id), name: String(r.name), stock: num(r.stock) })),
  };
}

async function marketing(db: Db, storeId: number, now: Date): Promise<MarketingTasks> {
  const live =
    '(active = 1 AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?))';
  const campaigns = await db.query<Record<string, unknown>>(
    `SELECT id, name, percent_off, ends_at FROM campaigns WHERE store_id = ? AND ${live}
     ORDER BY ends_at IS NULL, ends_at LIMIT 5`,
    [storeId, now, now],
  );
  const [counts] = await db.query<Record<string, unknown>>(
    `SELECT
       (SELECT COUNT(*) FROM campaigns WHERE store_id = ? AND active = 1 AND starts_at > ?) AS scheduled,
       (SELECT COUNT(*) FROM vouchers WHERE store_id = ? AND ${live}) AS live_vouchers,
       (SELECT COUNT(*) FROM vouchers WHERE store_id = ? AND max_uses IS NOT NULL AND uses >= max_uses) AS used_up,
       (SELECT COUNT(*) FROM price_rules WHERE store_id = ? AND ${live}) AS live_rules,
       (SELECT COUNT(*) FROM newsletters WHERE store_id = ? AND status = 'draft') AS drafts,
       (SELECT COUNT(*) FROM newsletters WHERE store_id = ? AND status = 'sending') AS sending,
       (SELECT COUNT(*) FROM subscribers WHERE store_id = ? AND status = 'confirmed') AS subscribers`,
    [storeId, now, storeId, now, now, storeId, storeId, now, now, storeId, storeId, storeId],
  );
  return {
    liveCampaigns: campaigns.map((r) => ({
      id: num(r.id),
      name: String(r.name),
      percentOff: num(r.percent_off),
      endsAt: r.ends_at ? iso(r.ends_at) : null,
    })),
    scheduledCampaigns: num(counts?.scheduled),
    liveVouchers: num(counts?.live_vouchers),
    usedUpVouchers: num(counts?.used_up),
    liveRules: num(counts?.live_rules),
    draftNewsletters: num(counts?.drafts),
    sendingNewsletters: num(counts?.sending),
    subscribers: num(counts?.subscribers),
  };
}

async function maintenance(db: Db, store: Store): Promise<MaintenanceTasks> {
  const [languages] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM store_languages WHERE store_id = ?',
    [store.id],
  );
  const s = store.seller;
  return {
    maintenance: store.maintenance,
    published: store.published,
    checks: [
      { key: 'open', ok: store.published && !store.maintenance, href: '/settings' },
      { key: 'payments', ok: methodsOf(store).length > 0, href: '/settings/payments' },
      { key: 'shipping', ok: (await zonesOf(db, store.id)).length > 0, href: '/settings/shipping' },
      {
        key: 'seller',
        ok: Boolean(s.companyName && s.email && store.terms && store.returnsPolicy),
        href: '/settings',
      },
      { key: 'email', ok: shopMailConfigured(), href: '/help#newsletter' },
      {
        key: 'brand',
        ok: store.logoVersion !== null && store.bannerVersion !== null,
        href: '/settings/design',
      },
      { key: 'languages', ok: num(languages?.n) > 0, href: '/settings/languages' },
    ],
  };
}

/** The panels these roles see, with their numbers. */
export async function taskBoard(
  db: Db,
  store: Store,
  panels: TaskPanel[],
  now: Date,
): Promise<TaskBoard> {
  const board: TaskBoard = {};
  if (panels.includes('shipping')) board.shipping = await shipping(db, store.id);
  if (panels.includes('support')) board.support = await support(db, store.id);
  if (panels.includes('catalog')) board.catalog = await catalog(db, store.id);
  if (panels.includes('marketing')) board.marketing = await marketing(db, store.id, now);
  if (panels.includes('maintenance')) board.maintenance = await maintenance(db, store);
  return board;
}
