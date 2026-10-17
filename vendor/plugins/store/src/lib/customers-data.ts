import type { PluginDatabase } from '@devquake/plugin-sdk';
import { buyerOrders, deleteBuyer, type BuyerOrder } from './buyers-data';
import { favoritesOf } from './favorites-data';
import type { FavoriteView } from './favorites';

// The shop's customers for its owner and team (ADR 0064): buyer accounts and DevQuake members
// who voted or saved favourites, with what they gave the shop (reviews, votes, messages) and how
// each was resolved (answered, closed). SQL with ? placeholders only; every query names the store.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

/** 'b<id>' a buyer account, 'u<id>' a DevQuake member without one here. */
export const CUSTOMER_KEY = /^[bu][1-9][0-9]{0,9}$/;

export interface CustomerRow {
  key: string;
  /** Buyer accounts only. */
  email: string | null;
  name: string | null;
  /** A DevQuake member (connected account or member key). */
  member: boolean;
  joinedAt: string | null;
  lastSeenAt: string | null;
  blocked: boolean;
  orders: number;
  reviews: number;
  votes: number;
  favorites: number;
  openThreads: number;
  closedThreads: number;
}

export type CustomerFilter = 'all' | 'buyers' | 'members' | 'open' | 'blocked';

/**
 * Everyone with an account or activity in the shop, most recently seen first. Members are
 * listed by their buyer account when they connected one; otherwise by their member key, with no
 * name or address (the shop never sees members' DevQuake profiles).
 */
export async function listCustomers(
  db: Db,
  storeId: number,
  filter: CustomerFilter = 'all',
  search = '',
): Promise<CustomerRow[]> {
  const buyers =
    filter === 'members'
      ? []
      : await db.query<Record<string, unknown>>(
          // sql-safe: the two optional conditions are fixed fragments; values are ? parameters
          `SELECT b.id, b.email, b.name, b.platform_user_id, b.created_at, b.last_seen_at, b.blocked_at,
             (SELECT COUNT(*) FROM orders o WHERE o.store_id = b.store_id AND o.buyer_email = b.email) AS orders,
             (SELECT COUNT(*) FROM reviews r JOIN orders o ON o.id = r.order_id
               WHERE r.store_id = b.store_id AND o.buyer_email = b.email) AS reviews,
             (SELECT COUNT(*) FROM interest_votes v WHERE v.store_id = b.store_id
               AND v.voter_key IN (CONCAT('b', b.id), CONCAT('u', COALESCE(b.platform_user_id, 0)))) AS votes,
             (SELECT COUNT(*) FROM favorites f WHERE f.store_id = b.store_id
               AND f.owner_key IN (CONCAT('b', b.id), CONCAT('u', COALESCE(b.platform_user_id, 0)))) AS favorites,
             (SELECT COUNT(*) FROM threads t WHERE t.buyer_id = b.id AND t.status = 'open') AS open_threads,
             (SELECT COUNT(*) FROM threads t WHERE t.buyer_id = b.id AND t.status = 'closed') AS closed_threads
           FROM buyers b
           WHERE b.store_id = ?
             ${filter === 'blocked' ? 'AND b.blocked_at IS NOT NULL' : ''}
             ${search ? 'AND (b.email LIKE ? OR b.name LIKE ?)' : ''}
           ORDER BY COALESCE(b.last_seen_at, b.created_at) DESC LIMIT 500`,
          search ? [storeId, like(search), like(search)] : [storeId],
        );
  const rows: CustomerRow[] = buyers.map((r) => ({
    key: `b${num(r.id)}`,
    email: String(r.email),
    name: (r.name as string | null) ?? null,
    member: r.platform_user_id != null,
    joinedAt: iso(r.created_at),
    lastSeenAt: iso(r.last_seen_at),
    blocked: r.blocked_at != null,
    orders: num(r.orders),
    reviews: num(r.reviews),
    votes: num(r.votes),
    favorites: num(r.favorites),
    openThreads: num(r.open_threads),
    closedThreads: num(r.closed_threads),
  }));
  // Members who voted or saved favourites without a buyer account here.
  if (filter === 'all' || filter === 'members') {
    const members = search
      ? []
      : await db.query<{
          k: string;
          votes: number;
          favorites: number;
          first_at: Date;
          last_at: Date;
        }>(
          `SELECT k, SUM(votes) AS votes, SUM(favs) AS favorites, MIN(at) AS first_at, MAX(at) AS last_at FROM (
             SELECT voter_key AS k, 1 AS votes, 0 AS favs, updated_at AS at FROM interest_votes
               WHERE store_id = ? AND voter_key LIKE 'u%'
             UNION ALL
             SELECT owner_key AS k, 0, 1, created_at FROM favorites
               WHERE store_id = ? AND owner_key LIKE 'u%'
           ) x
           WHERE NOT EXISTS (SELECT 1 FROM buyers b WHERE b.store_id = ? AND CONCAT('u', b.platform_user_id) = x.k)
           GROUP BY k ORDER BY last_at DESC LIMIT 500`,
          [storeId, storeId, storeId],
        );
    for (const m of members) {
      rows.push({
        key: m.k,
        email: null,
        name: null,
        member: true,
        joinedAt: iso(m.first_at),
        lastSeenAt: iso(m.last_at),
        blocked: false,
        orders: 0,
        reviews: 0,
        votes: num(m.votes),
        favorites: num(m.favorites),
        openThreads: 0,
        closedThreads: 0,
      });
    }
  }
  if (filter === 'buyers') return rows.filter((r) => r.key.startsWith('b'));
  if (filter === 'open') return rows.filter((r) => r.openThreads > 0);
  return rows;
}

const like = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export interface CustomerReview {
  id: number;
  product: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: 'pending' | 'published' | 'hidden';
  replied: boolean;
  createdAt: string | null;
}

export interface CustomerVote {
  product: string;
  interested: boolean;
  minCents: number | null;
  maxCents: number | null;
  at: string | null;
}

export interface CustomerThread {
  id: number;
  subject: string;
  status: 'open' | 'closed';
  lastAt: string | null;
  messages: number;
  answered: boolean;
}

export interface CustomerDetail extends CustomerRow {
  orderList: BuyerOrder[];
  reviewList: CustomerReview[];
  voteList: CustomerVote[];
  favoriteList: FavoriteView[];
  threadList: CustomerThread[];
}

/** One customer with everything they gave the shop, or null when unknown here. */
export async function customerDetail(
  db: Db,
  storeId: number,
  key: string,
): Promise<CustomerDetail | null> {
  if (!CUSTOMER_KEY.test(key)) return null;
  const id = Number(key.slice(1));
  let base: CustomerRow | null = null;
  let keys: string[] = [key];
  let email: string | null = null;
  if (key.startsWith('b')) {
    const [b] = await db.query<Record<string, unknown>>(
      'SELECT * FROM buyers WHERE id = ? AND store_id = ?',
      [id, storeId],
    );
    if (!b) return null;
    email = String(b.email);
    if (b.platform_user_id != null) keys = [key, `u${num(b.platform_user_id)}`];
    base = {
      key,
      email,
      name: (b.name as string | null) ?? null,
      member: b.platform_user_id != null,
      joinedAt: iso(b.created_at),
      lastSeenAt: iso(b.last_seen_at),
      blocked: b.blocked_at != null,
      orders: 0,
      reviews: 0,
      votes: 0,
      favorites: 0,
      openThreads: 0,
      closedThreads: 0,
    };
  }

  const marks = keys.map(() => '?').join(', ');
  const votes = await db.query<Record<string, unknown>>(
    // sql-safe: marks — one ? per key
    `SELECT p.name, v.interested, v.min_cents, v.max_cents, v.updated_at FROM interest_votes v
       JOIN products p ON p.id = v.product_id
      WHERE v.store_id = ? AND v.voter_key IN (${marks}) ORDER BY v.updated_at DESC LIMIT 200`,
    [storeId, ...keys],
  );
  const favorites = (await Promise.all(keys.map((k) => favoritesOf(db, storeId, k)))).flat();
  if (!base) {
    if (votes.length === 0 && favorites.length === 0) return null;
    base = {
      key,
      email: null,
      name: null,
      member: true,
      joinedAt: null,
      lastSeenAt: null,
      blocked: false,
      orders: 0,
      reviews: 0,
      votes: 0,
      favorites: 0,
      openThreads: 0,
      closedThreads: 0,
    };
  }

  const orderList = email ? await buyerOrders(db, storeId, email) : [];
  const reviews = email
    ? await db.query<Record<string, unknown>>(
        `SELECT r.id, p.name AS product, r.rating, r.title, r.body, r.status, r.reply, r.created_at
           FROM reviews r JOIN orders o ON o.id = r.order_id JOIN products p ON p.id = r.product_id
          WHERE r.store_id = ? AND o.buyer_email = ? ORDER BY r.created_at DESC LIMIT 200`,
        [storeId, email],
      )
    : [];
  const threads = key.startsWith('b')
    ? await db.query<Record<string, unknown>>(
        `SELECT t.id, t.subject, t.status, t.last_at,
           (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id) AS messages,
           (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id AND m.from_shop = 1) AS answers
           FROM threads t WHERE t.store_id = ? AND t.buyer_id = ? ORDER BY t.last_at DESC LIMIT 200`,
        [storeId, id],
      )
    : [];

  const threadList: CustomerThread[] = threads.map((t) => ({
    id: num(t.id),
    subject: String(t.subject),
    status: t.status as 'open' | 'closed',
    lastAt: iso(t.last_at),
    messages: num(t.messages),
    answered: num(t.answers) > 0,
  }));
  return {
    ...base,
    orders: orderList.length,
    reviews: reviews.length,
    votes: votes.length,
    favorites: favorites.length,
    openThreads: threadList.filter((t) => t.status === 'open').length,
    closedThreads: threadList.filter((t) => t.status === 'closed').length,
    orderList,
    reviewList: reviews.map((r) => ({
      id: num(r.id),
      product: String(r.product),
      rating: num(r.rating),
      title: (r.title as string | null) ?? null,
      body: (r.body as string | null) ?? null,
      status: r.status as CustomerReview['status'],
      replied: r.reply != null && r.reply !== '',
      createdAt: iso(r.created_at),
    })),
    voteList: votes.map((v) => ({
      product: String(v.name),
      interested: Boolean(num(v.interested)),
      minCents: v.min_cents == null ? null : num(v.min_cents),
      maxCents: v.max_cents == null ? null : num(v.max_cents),
      at: iso(v.updated_at),
    })),
    favoriteList: favorites,
    threadList,
  };
}

/** Blocks or unblocks a buyer account; a block also ends their sessions. */
export async function setBlocked(
  db: Db,
  storeId: number,
  buyerId: number,
  blocked: boolean,
): Promise<boolean> {
  const res = await db.execute(
    // sql-safe: one of two fixed expressions
    `UPDATE buyers SET blocked_at = ${blocked ? 'UTC_TIMESTAMP()' : 'NULL'} WHERE id = ? AND store_id = ?`,
    [buyerId, storeId],
  );
  if (blocked && res.affectedRows > 0) {
    await db.execute('DELETE FROM buyer_tokens WHERE buyer_id = ?', [buyerId]);
  }
  return res.affectedRows > 0;
}

/** Deletes a buyer's account as the owner (orders stay, as when the buyer deletes it). */
export async function deleteCustomer(db: Db, storeId: number, buyerId: number): Promise<void> {
  await deleteBuyer(db, storeId, buyerId);
}

/** Takes a DevQuake member's votes and favourites out of this shop (members have no account). */
export async function forgetMember(db: Db, storeId: number, userId: number): Promise<void> {
  await db.execute('DELETE FROM interest_votes WHERE store_id = ? AND voter_key = ?', [
    storeId,
    `u${userId}`,
  ]);
  await db.execute('DELETE FROM favorites WHERE store_id = ? AND owner_key = ?', [
    storeId,
    `u${userId}`,
  ]);
}
