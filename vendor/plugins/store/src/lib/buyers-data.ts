import { randomBytes } from 'node:crypto';
import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { Locale } from '@devquake/ui';
import { HttpError } from './http';
import type { OrderStatus, PaymentMethod } from './model';
import { hashCode } from './team-data';

// Buyers' accounts and their messages with the shop (ADR 0058). A buyer is an email address in
// one shop: they sign in with a link sent to it (no password); the session is a cookie whose
// SHA-256 is stored. SQL with ? placeholders only; every query names the store.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

export const LINK_MINUTES = 30;
export const SESSION_DAYS = 90;
export const TOKEN = /^[A-Za-z0-9_-]{43}$/;
export { MESSAGE_LIMITS } from './buyers-data-limits';

/**
 * The cookie's value after signing out: a DevQuake member who connected the shop is otherwise
 * recognised without a cookie (ADR 0059), so signing out must be remembered.
 */
export const SIGNED_OUT = 'out';

/** The session cookie of a shop (one per store, so several shops never mix). */
export const buyerCookie = (storeId: number) => `dq_store_buyer_${storeId}`;

/** Delivery details a buyer saved, to fill in the checkout (ADR 0059). */
export interface BuyerDetails {
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface Buyer {
  id: number;
  storeId: number;
  email: string;
  name: string | null;
  locale: Locale;
  /** The DevQuake member who connected this account, if any (ADR 0059). */
  platformUserId: number | null;
  details: BuyerDetails;
}

const text = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null);

const toBuyer = (r: Record<string, unknown>): Buyer => ({
  id: num(r.id),
  storeId: num(r.store_id),
  email: String(r.email),
  name: (r.name as string | null) ?? null,
  locale: (r.locale as Locale) ?? 'en',
  platformUserId: r.platform_user_id == null ? null : num(r.platform_user_id),
  details: {
    phone: text(r.phone),
    addressLine: text(r.address_line),
    city: text(r.city),
    postalCode: text(r.postal_code),
    country: text(r.country),
  },
});

const newToken = () => randomBytes(32).toString('base64url');

/** The buyer with this email in the shop, made when needed. */
export async function buyerFor(
  db: Db,
  storeId: number,
  email: string,
  locale: Locale,
  name: string | null = null,
): Promise<Buyer> {
  await db.execute(
    `INSERT INTO buyers (store_id, email, locale, name) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE locale = VALUES(locale), name = COALESCE(name, VALUES(name))`,
    [storeId, email.toLowerCase(), locale, name],
  );
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM buyers WHERE store_id = ? AND email = ?',
    [storeId, email.toLowerCase()],
  );
  return toBuyer(r!);
}

/**
 * The account of a DevQuake member in this shop (ADR 0059): the one they connected before, else
 * the buyer with their DevQuake address (their orders by email follow), linked now, else a new
 * one with their name. `email` is the member's own address from the platform, already verified,
 * so its member owns that account even when another member linked it under an old address.
 */
export async function buyerForMember(
  db: Db,
  storeId: number,
  userId: number,
  email: string,
  name: string,
  locale: Locale,
): Promise<Buyer> {
  const linked = await buyerOfMember(db, storeId, userId);
  if (linked) return linked;
  const address = email.toLowerCase();
  await db.execute(
    `INSERT INTO buyers (store_id, email, platform_user_id, locale, name) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE platform_user_id = VALUES(platform_user_id),
       name = COALESCE(name, VALUES(name))`,
    [storeId, address, userId, locale, name.slice(0, 120) || null],
  );
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM buyers WHERE store_id = ? AND email = ?',
    [storeId, address],
  );
  return toBuyer(r!);
}

/** The account a DevQuake member connected in this shop, if any. */
export async function buyerOfMember(
  db: Db,
  storeId: number,
  userId: number,
): Promise<Buyer | null> {
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM buyers WHERE store_id = ? AND platform_user_id = ?',
    [storeId, userId],
  );
  return r ? toBuyer(r) : null;
}

/** A new session for a buyer (a token for the cookie). */
export async function createSession(db: Db, buyerId: number): Promise<string> {
  const session = newToken();
  await db.execute(
    `INSERT INTO buyer_tokens (token_hash, buyer_id, kind, expires_at)
     VALUES (?, ?, 'session', UTC_TIMESTAMP() + INTERVAL ${SESSION_DAYS} DAY)`,
    [hashCode(session), buyerId],
  );
  return session;
}

/** The buyer's saved delivery details (null clears one). */
export async function setBuyerDetails(db: Db, buyerId: number, d: BuyerDetails): Promise<void> {
  await db.execute(
    'UPDATE buyers SET phone = ?, address_line = ?, city = ?, postal_code = ?, country = ? WHERE id = ?',
    [d.phone, d.addressLine, d.city, d.postalCode, d.country, buyerId],
  );
}

/** A one-time sign-in link's token (valid LINK_MINUTES). */
export async function createSignInLink(db: Db, buyerId: number): Promise<string> {
  const token = newToken();
  await db.execute('DELETE FROM buyer_tokens WHERE expires_at <= UTC_TIMESTAMP()');
  await db.execute(
    `INSERT INTO buyer_tokens (token_hash, buyer_id, kind, expires_at)
     VALUES (?, ?, 'link', UTC_TIMESTAMP() + INTERVAL ${LINK_MINUTES} MINUTE)`,
    [hashCode(token), buyerId],
  );
  return token;
}

/** Uses a sign-in link once: a new session's token, or null when the link is unknown or old. */
export async function useSignInLink(
  db: PluginDatabase,
  storeId: number,
  token: string,
): Promise<string | null> {
  if (!TOKEN.test(token)) return null;
  return db.transaction(async (tx) => {
    const [r] = await tx.query<{ buyer_id: number }>(
      `SELECT t.buyer_id FROM buyer_tokens t JOIN buyers b ON b.id = t.buyer_id
       WHERE t.token_hash = ? AND t.kind = 'link' AND t.expires_at > UTC_TIMESTAMP() AND b.store_id = ?
       FOR UPDATE`,
      [hashCode(token), storeId],
    );
    if (!r) return null;
    await tx.execute('DELETE FROM buyer_tokens WHERE token_hash = ?', [hashCode(token)]);
    const session = newToken();
    await tx.execute(
      `INSERT INTO buyer_tokens (token_hash, buyer_id, kind, expires_at)
       VALUES (?, ?, 'session', UTC_TIMESTAMP() + INTERVAL ${SESSION_DAYS} DAY)`,
      [hashCode(session), r.buyer_id],
    );
    return session;
  });
}

/** The signed-in buyer of a session cookie in this shop. */
export async function buyerBySession(
  db: Db,
  storeId: number,
  token: string | undefined | null,
): Promise<Buyer | null> {
  if (!token || !TOKEN.test(token)) return null;
  const [r] = await db.query<Record<string, unknown>>(
    `SELECT b.* FROM buyer_tokens t JOIN buyers b ON b.id = t.buyer_id
     WHERE t.token_hash = ? AND t.kind = 'session' AND t.expires_at > UTC_TIMESTAMP() AND b.store_id = ?`,
    [hashCode(token), storeId],
  );
  if (!r) return null;
  await db.execute(
    'UPDATE buyers SET last_seen_at = UTC_TIMESTAMP() WHERE id = ? AND (last_seen_at IS NULL OR last_seen_at < UTC_TIMESTAMP() - INTERVAL 1 HOUR)',
    [r.id],
  );
  return toBuyer(r);
}

export async function endSession(db: Db, token: string): Promise<void> {
  if (TOKEN.test(token))
    await db.execute("DELETE FROM buyer_tokens WHERE token_hash = ? AND kind = 'session'", [
      hashCode(token),
    ]);
}

/**
 * The buyer's account goes, with their messages and sessions. Orders stay with the shop (it
 * must keep its sales records), and so do their newsletter choices (unsubscribed separately).
 */
export async function deleteBuyer(db: Db, storeId: number, buyerId: number): Promise<void> {
  await db.execute('DELETE FROM buyers WHERE id = ? AND store_id = ?', [buyerId, storeId]);
}

export async function setBuyerName(db: Db, buyerId: number, name: string | null): Promise<void> {
  await db.execute('UPDATE buyers SET name = ? WHERE id = ?', [name, buyerId]);
}

export interface BuyerOrder {
  id: number;
  code: string;
  status: OrderStatus;
  method: PaymentMethod;
  totalCents: number;
  currency: string;
  createdAt: string;
  pieces: number;
  names: string[];
}

/** The orders placed with the buyer's email address in this shop, newest first. */
export async function buyerOrders(db: Db, storeId: number, email: string): Promise<BuyerOrder[]> {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT o.id, o.code, o.status, o.payment_method, o.total_cents, o.currency, o.created_at,
       (SELECT COALESCE(SUM(i.quantity), 0) FROM order_items i WHERE i.order_id = o.id) AS pieces,
       (SELECT GROUP_CONCAT(i.name ORDER BY i.id SEPARATOR '\n') FROM order_items i WHERE i.order_id = o.id) AS names
     FROM orders o WHERE o.store_id = ? AND o.buyer_email = ? ORDER BY o.id DESC LIMIT 200`,
    [storeId, email],
  );
  return rows.map((r) => ({
    id: num(r.id),
    code: String(r.code),
    status: r.status as OrderStatus,
    method: r.payment_method as PaymentMethod,
    totalCents: num(r.total_cents),
    currency: String(r.currency),
    createdAt: iso(r.created_at) ?? '',
    pieces: num(r.pieces),
    names: [
      ...new Set(
        String(r.names ?? '')
          .split('\n')
          .filter(Boolean),
      ),
    ],
  }));
}

// ---------------------------------------------------------------------------------------------
// Messages

export interface ThreadSummary {
  id: number;
  subject: string;
  status: 'open' | 'closed';
  orderId: number | null;
  lastAt: string;
  /** Unread for whoever is asking (the shop or the buyer). */
  unread: boolean;
  buyerEmail: string;
  buyerName: string | null;
  lastMessage: string;
}

export interface Message {
  id: number;
  fromShop: boolean;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Thread extends ThreadSummary {
  buyerId: number;
  messages: Message[];
}

function toSummary(r: Record<string, unknown>, forShop: boolean): ThreadSummary {
  return {
    id: num(r.id),
    subject: String(r.subject),
    status: r.status as 'open' | 'closed',
    orderId: r.order_id === null ? null : num(r.order_id),
    lastAt: iso(r.last_at) ?? '',
    unread: forShop ? !r.shop_read : !r.buyer_read,
    buyerEmail: String(r.email),
    buyerName: (r.name as string | null) ?? null,
    lastMessage: String(r.last_body ?? '').slice(0, 160),
  };
}

const THREAD_SQL = `SELECT th.*, b.email, b.name,
  (SELECT m.body FROM messages m WHERE m.thread_id = th.id ORDER BY m.id DESC LIMIT 1) AS last_body
  FROM threads th JOIN buyers b ON b.id = th.buyer_id`;

export async function threadsOfStore(
  db: Db,
  storeId: number,
  filter: 'all' | 'unread' | 'open',
): Promise<ThreadSummary[]> {
  const rows = await db.query<Record<string, unknown>>(
    `${THREAD_SQL} WHERE th.store_id = ?
     ${filter === 'unread' ? 'AND th.shop_read = 0' : filter === 'open' ? "AND th.status = 'open'" : ''}
     ORDER BY th.last_at DESC LIMIT 300`,
    [storeId],
  );
  return rows.map((r) => toSummary(r, true));
}

export async function threadsOfBuyer(db: Db, buyer: Buyer): Promise<ThreadSummary[]> {
  const rows = await db.query<Record<string, unknown>>(
    `${THREAD_SQL} WHERE th.store_id = ? AND th.buyer_id = ? ORDER BY th.last_at DESC LIMIT 100`,
    [buyer.storeId, buyer.id],
  );
  return rows.map((r) => toSummary(r, false));
}

export async function unreadThreads(db: Db, storeId: number): Promise<number> {
  const [r] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM threads WHERE store_id = ? AND shop_read = 0',
    [storeId],
  );
  return num(r?.n);
}

export async function unreadForBuyer(db: Db, buyer: Buyer): Promise<number> {
  const [r] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM threads WHERE store_id = ? AND buyer_id = ? AND buyer_read = 0',
    [buyer.storeId, buyer.id],
  );
  return num(r?.n);
}

/** A conversation for the shop (any of its threads) or a buyer (only theirs); marks it read. */
export async function openThread(
  db: Db,
  storeId: number,
  threadId: number,
  who: { shop: true } | { buyerId: number },
): Promise<Thread | null> {
  const forShop = 'shop' in who;
  const [r] = await db.query<Record<string, unknown>>(
    `${THREAD_SQL} WHERE th.id = ? AND th.store_id = ? ${forShop ? '' : 'AND th.buyer_id = ?'}`,
    forShop ? [threadId, storeId] : [threadId, storeId, who.buyerId],
  );
  if (!r) return null;
  const messages = await db.query<Record<string, unknown>>(
    'SELECT * FROM messages WHERE thread_id = ? ORDER BY id LIMIT 500',
    [threadId],
  );
  await db.execute(
    forShop
      ? 'UPDATE threads SET shop_read = 1 WHERE id = ?'
      : 'UPDATE threads SET buyer_read = 1 WHERE id = ?',
    [threadId],
  );
  return {
    ...toSummary(r, forShop),
    unread: false,
    buyerId: num(r.buyer_id),
    messages: messages.map((m) => ({
      id: num(m.id),
      fromShop: Boolean(m.from_shop),
      authorName: String(m.author_name),
      body: String(m.body),
      createdAt: iso(m.created_at) ?? '',
    })),
  };
}

/** A buyer starts a conversation, about one of their own orders or not. */
export async function startThread(
  db: PluginDatabase,
  buyer: Buyer,
  input: { subject: string; body: string; orderId: number | null },
): Promise<number> {
  const [{ n } = { n: 0 }] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM threads WHERE buyer_id = ? AND last_at > UTC_TIMESTAMP() - INTERVAL 1 DAY',
    [buyer.id],
  );
  if (num(n) >= 10) throw new HttpError(429, 'tooMany');
  if (input.orderId !== null) {
    const [o] = await db.query<{ id: number }>(
      'SELECT id FROM orders WHERE id = ? AND store_id = ? AND buyer_email = ?',
      [input.orderId, buyer.storeId, buyer.email],
    );
    if (!o) throw new HttpError(404, 'orderNotFound');
  }
  return db.transaction(async (tx) => {
    const res = await tx.execute(
      'INSERT INTO threads (store_id, buyer_id, order_id, subject, shop_read, buyer_read) VALUES (?, ?, ?, ?, 0, 1)',
      [buyer.storeId, buyer.id, input.orderId, input.subject],
    );
    await tx.execute(
      'INSERT INTO messages (thread_id, from_shop, author_name, body) VALUES (?, 0, ?, ?)',
      [res.insertId, buyer.name ?? buyer.email, input.body],
    );
    return res.insertId;
  });
}

/** A new message in a conversation: from the shop (to the buyer) or from its buyer. */
export async function addMessage(
  db: PluginDatabase,
  storeId: number,
  threadId: number,
  from: { shop: true; name: string } | { buyer: Buyer },
  body: string,
): Promise<void> {
  const fromShop = 'shop' in from;
  await db.transaction(async (tx) => {
    const [t] = await tx.query<{ buyer_id: number }>(
      'SELECT buyer_id FROM threads WHERE id = ? AND store_id = ? FOR UPDATE',
      [threadId, storeId],
    );
    if (!t || (!fromShop && num(t.buyer_id) !== from.buyer.id))
      throw new HttpError(404, 'notFound');
    await tx.execute(
      'INSERT INTO messages (thread_id, from_shop, author_name, body) VALUES (?, ?, ?, ?)',
      [
        threadId,
        fromShop ? 1 : 0,
        fromShop ? from.name : (from.buyer.name ?? from.buyer.email),
        body,
      ],
    );
    await tx.execute(
      fromShop
        ? "UPDATE threads SET last_at = UTC_TIMESTAMP(), shop_read = 1, buyer_read = 0, status = 'open' WHERE id = ?"
        : "UPDATE threads SET last_at = UTC_TIMESTAMP(), shop_read = 0, buyer_read = 1, status = 'open', owner_notified_at = NULL WHERE id = ?",
      [threadId],
    );
  });
}

export async function setThreadStatus(
  db: Db,
  storeId: number,
  threadId: number,
  status: 'open' | 'closed',
): Promise<void> {
  const res = await db.execute('UPDATE threads SET status = ? WHERE id = ? AND store_id = ?', [
    status,
    threadId,
    storeId,
  ]);
  if (res.affectedRows === 0) {
    const [r] = await db.query<{ id: number }>(
      'SELECT id FROM threads WHERE id = ? AND store_id = ?',
      [threadId, storeId],
    );
    if (!r) throw new HttpError(404, 'notFound');
  }
}

/** The buyer of a thread, for the email telling them about the shop's answer. */
export async function threadBuyer(db: Db, storeId: number, threadId: number) {
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT b.*, th.subject FROM threads th JOIN buyers b ON b.id = th.buyer_id WHERE th.id = ? AND th.store_id = ?',
    [threadId, storeId],
  );
  return r ? { buyer: toBuyer(r), subject: String(r.subject) } : null;
}

/** Conversations with buyers' messages the owner has not been emailed about (scheduled hook). */
export async function threadsToAnnounce(db: Db, limit = 20) {
  const rows = await db.query<{
    id: number;
    store_id: number;
    owner_user_id: number;
    subject: string;
  }>(
    `SELECT th.id, th.store_id, th.subject, s.owner_user_id FROM threads th JOIN stores s ON s.id = th.store_id
     WHERE th.shop_read = 0 AND th.owner_notified_at IS NULL
     ORDER BY th.last_at LIMIT ${Math.min(100, Math.max(1, limit))}`,
  );
  return rows.map((r) => ({
    id: num(r.id),
    storeId: num(r.store_id),
    ownerUserId: num(r.owner_user_id),
    subject: r.subject,
  }));
}

export async function markThreadAnnounced(db: Db, threadId: number): Promise<void> {
  await db.execute('UPDATE threads SET owner_notified_at = UTC_TIMESTAMP() WHERE id = ?', [
    threadId,
  ]);
}
