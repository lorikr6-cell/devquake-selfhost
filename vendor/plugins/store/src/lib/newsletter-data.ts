import { randomBytes } from 'node:crypto';
import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { Locale } from '@devquake/ui';
import { HttpError } from './http';

// The newsletter (ADR 0058): subscribers who confirmed their address (double opt-in) and email
// campaigns with chosen products, sent in small batches. SQL with ? placeholders only.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

export const SUBSCRIBER_TOKEN = /^[A-Za-z0-9_-]{32}$/;
export const NEWSLETTER_LIMITS = {
  subject: 150,
  preheader: 150,
  heading: 150,
  intro: 5000,
  products: 24,
  /** Emails per batch (a request or the hourly job). */
  batch: 25,
} as const;

export { NEWSLETTER_SECTIONS, type NewsletterSection } from './newsletter-data-types';
import type { NewsletterSection } from './newsletter-data-types';

// ---------------------------------------------------------------------------------------------
// Subscribers

export type SubscriberStatus = 'pending' | 'confirmed' | 'unsubscribed';

export interface Subscriber {
  id: number;
  email: string;
  locale: Locale;
  status: SubscriberStatus;
  token: string;
  source: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

const toSubscriber = (r: Record<string, unknown>): Subscriber => ({
  id: num(r.id),
  email: String(r.email),
  locale: (r.locale as Locale) ?? 'en',
  status: r.status as SubscriberStatus,
  token: String(r.token),
  source: (r.source as string | null) ?? null,
  createdAt: iso(r.created_at) ?? '',
  confirmedAt: iso(r.confirmed_at),
});

/**
 * Someone asks for the newsletter: a pending subscriber (or the existing one). Answers whether
 * a confirmation email is needed (not for an address already confirmed).
 */
export async function subscribe(
  db: Db,
  storeId: number,
  email: string,
  locale: Locale,
  source: string,
): Promise<{ subscriber: Subscriber; needsConfirmation: boolean }> {
  const address = email.toLowerCase();
  const [existing] = await db.query<Record<string, unknown>>(
    'SELECT * FROM subscribers WHERE store_id = ? AND email = ?',
    [storeId, address],
  );
  if (existing) {
    const s = toSubscriber(existing);
    if (s.status === 'confirmed') return { subscriber: s, needsConfirmation: false };
    await db.execute("UPDATE subscribers SET status = 'pending', locale = ? WHERE id = ?", [
      locale,
      s.id,
    ]);
    return { subscriber: { ...s, status: 'pending', locale }, needsConfirmation: true };
  }
  const token = randomBytes(24).toString('base64url');
  const res = await db.execute(
    'INSERT INTO subscribers (store_id, email, locale, token, source) VALUES (?, ?, ?, ?, ?)',
    [storeId, address, locale, token, source.slice(0, 20)],
  );
  const [r] = await db.query<Record<string, unknown>>('SELECT * FROM subscribers WHERE id = ?', [
    res.insertId,
  ]);
  return { subscriber: toSubscriber(r!), needsConfirmation: true };
}

export async function subscriberByToken(
  db: Db,
  storeId: number,
  token: string,
): Promise<Subscriber | null> {
  if (!SUBSCRIBER_TOKEN.test(token)) return null;
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM subscribers WHERE store_id = ? AND token = ?',
    [storeId, token],
  );
  return r ? toSubscriber(r) : null;
}

export async function subscriberByEmail(
  db: Db,
  storeId: number,
  email: string,
): Promise<Subscriber | null> {
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM subscribers WHERE store_id = ? AND email = ?',
    [storeId, email.toLowerCase()],
  );
  return r ? toSubscriber(r) : null;
}

export async function confirmSubscriber(db: Db, id: number): Promise<void> {
  await db.execute(
    "UPDATE subscribers SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, UTC_TIMESTAMP()), unsubscribed_at = NULL WHERE id = ?",
    [id],
  );
}

export async function unsubscribe(db: Db, id: number): Promise<void> {
  await db.execute(
    "UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = UTC_TIMESTAMP() WHERE id = ?",
    [id],
  );
  await db.execute(
    "UPDATE newsletter_deliveries SET status = 'failed' WHERE subscriber_id = ? AND status = 'queued'",
    [id],
  );
}

export async function listSubscribers(
  db: Db,
  storeId: number,
  status: SubscriberStatus | null,
): Promise<Subscriber[]> {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT * FROM subscribers WHERE store_id = ? ${status ? 'AND status = ?' : ''}
     ORDER BY created_at DESC LIMIT 5000`,
    status ? [storeId, status] : [storeId],
  );
  return rows.map(toSubscriber);
}

export async function subscriberCounts(db: Db, storeId: number) {
  const rows = await db.query<{ status: SubscriberStatus; n: number }>(
    'SELECT status, COUNT(*) AS n FROM subscribers WHERE store_id = ? GROUP BY status',
    [storeId],
  );
  const get = (s: SubscriberStatus) => num(rows.find((r) => r.status === s)?.n);
  return {
    confirmed: get('confirmed'),
    pending: get('pending'),
    unsubscribed: get('unsubscribed'),
  };
}

/** The owner removes an address entirely (on request, under GDPR). */
export async function deleteSubscriber(db: Db, storeId: number, id: number): Promise<void> {
  const res = await db.execute('DELETE FROM subscribers WHERE id = ? AND store_id = ?', [
    id,
    storeId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}

// ---------------------------------------------------------------------------------------------
// Email campaigns

export type NewsletterStatus = 'draft' | 'sending' | 'sent';

export interface Newsletter {
  id: number;
  subject: string;
  preheader: string | null;
  heading: string | null;
  intro: string | null;
  voucherId: number | null;
  status: NewsletterStatus;
  recipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
  products: Array<{ productId: number; section: NewsletterSection }>;
}

export type NewsletterInput = Pick<
  Newsletter,
  'subject' | 'preheader' | 'heading' | 'intro' | 'voucherId' | 'products'
>;

async function productsOf(db: Db, ids: number[]) {
  if (ids.length === 0) return [];
  return db.query<{ newsletter_id: number; product_id: number; section: NewsletterSection }>(
    `SELECT newsletter_id, product_id, section FROM newsletter_products
     WHERE newsletter_id IN (${ids.map(() => '?').join(',')}) ORDER BY position`,
    ids,
  );
}

function toNewsletter(
  r: Record<string, unknown>,
  products: Array<{ newsletter_id: number; product_id: number; section: NewsletterSection }>,
): Newsletter {
  return {
    id: num(r.id),
    subject: String(r.subject),
    preheader: (r.preheader as string | null) ?? null,
    heading: (r.heading as string | null) ?? null,
    intro: (r.intro as string | null) ?? null,
    voucherId: r.voucher_id === null ? null : num(r.voucher_id),
    status: r.status as NewsletterStatus,
    recipients: num(r.recipients),
    sentCount: num(r.sent_count),
    failedCount: num(r.failed_count),
    createdAt: iso(r.created_at) ?? '',
    sentAt: iso(r.sent_at),
    products: products
      .filter((p) => num(p.newsletter_id) === num(r.id))
      .map((p) => ({ productId: num(p.product_id), section: p.section })),
  };
}

export async function listNewsletters(db: Db, storeId: number): Promise<Newsletter[]> {
  const rows = await db.query<Record<string, unknown>>(
    'SELECT * FROM newsletters WHERE store_id = ? ORDER BY created_at DESC LIMIT 200',
    [storeId],
  );
  const products = await productsOf(
    db,
    rows.map((r) => num(r.id)),
  );
  return rows.map((r) => toNewsletter(r, products));
}

export async function newsletterById(
  db: Db,
  storeId: number,
  id: number,
): Promise<Newsletter | null> {
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM newsletters WHERE id = ? AND store_id = ?',
    [id, storeId],
  );
  return r ? toNewsletter(r, await productsOf(db, [id])) : null;
}

async function writeNewsletterProducts(
  tx: Db,
  storeId: number,
  id: number,
  products: NewsletterInput['products'],
) {
  await tx.execute('DELETE FROM newsletter_products WHERE newsletter_id = ?', [id]);
  let position = 0;
  for (const p of products) {
    await tx.execute(
      `INSERT IGNORE INTO newsletter_products (newsletter_id, product_id, section, position)
       SELECT ?, id, ?, ? FROM products WHERE id = ? AND store_id = ?`,
      [id, p.section, position++, p.productId, storeId],
    );
  }
}

async function checkVoucher(db: Db, storeId: number, voucherId: number | null) {
  if (voucherId === null) return;
  const [v] = await db.query<{ id: number }>(
    'SELECT id FROM vouchers WHERE id = ? AND store_id = ?',
    [voucherId, storeId],
  );
  if (!v) throw new HttpError(400, 'invalidRequest');
}

export async function createNewsletter(
  db: PluginDatabase,
  storeId: number,
  input: NewsletterInput,
): Promise<number> {
  await checkVoucher(db, storeId, input.voucherId);
  return db.transaction(async (tx) => {
    const res = await tx.execute(
      'INSERT INTO newsletters (store_id, subject, preheader, heading, intro, voucher_id) VALUES (?, ?, ?, ?, ?, ?)',
      [storeId, input.subject, input.preheader, input.heading, input.intro, input.voucherId],
    );
    await writeNewsletterProducts(tx, storeId, res.insertId, input.products);
    return res.insertId;
  });
}

/** Only drafts change; a newsletter on its way or sent stays as it went out. */
export async function updateNewsletter(
  db: PluginDatabase,
  storeId: number,
  id: number,
  input: NewsletterInput,
): Promise<void> {
  await checkVoucher(db, storeId, input.voucherId);
  await db.transaction(async (tx) => {
    const [r] = await tx.query<{ status: NewsletterStatus }>(
      'SELECT status FROM newsletters WHERE id = ? AND store_id = ? FOR UPDATE',
      [id, storeId],
    );
    if (!r) throw new HttpError(404, 'notFound');
    if (r.status !== 'draft') throw new HttpError(409, 'newsletterSent');
    await tx.execute(
      'UPDATE newsletters SET subject = ?, preheader = ?, heading = ?, intro = ?, voucher_id = ? WHERE id = ?',
      [input.subject, input.preheader, input.heading, input.intro, input.voucherId, id],
    );
    await writeNewsletterProducts(tx, storeId, id, input.products);
  });
}

export async function deleteNewsletter(db: Db, storeId: number, id: number): Promise<void> {
  const res = await db.execute('DELETE FROM newsletters WHERE id = ? AND store_id = ?', [
    id,
    storeId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}

/** Queues a draft for every confirmed subscriber; answers how many will get it. */
export async function startSending(
  db: PluginDatabase,
  storeId: number,
  id: number,
): Promise<number> {
  return db.transaction(async (tx) => {
    const [r] = await tx.query<{ status: NewsletterStatus }>(
      'SELECT status FROM newsletters WHERE id = ? AND store_id = ? FOR UPDATE',
      [id, storeId],
    );
    if (!r) throw new HttpError(404, 'notFound');
    if (r.status !== 'draft') throw new HttpError(409, 'newsletterSent');
    const res = await tx.execute(
      `INSERT IGNORE INTO newsletter_deliveries (newsletter_id, subscriber_id)
       SELECT ?, id FROM subscribers WHERE store_id = ? AND status = 'confirmed'`,
      [id, storeId],
    );
    if (res.affectedRows === 0) throw new HttpError(409, 'noSubscribers');
    await tx.execute(
      "UPDATE newsletters SET status = 'sending', recipients = ?, sent_at = UTC_TIMESTAMP() WHERE id = ?",
      [res.affectedRows, id],
    );
    return res.affectedRows;
  });
}

/** The next queued recipients of a newsletter being sent. */
export async function nextRecipients(
  db: Db,
  newsletterId: number,
  limit: number = NEWSLETTER_LIMITS.batch,
): Promise<Subscriber[]> {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT s.* FROM newsletter_deliveries d JOIN subscribers s ON s.id = d.subscriber_id
     WHERE d.newsletter_id = ? AND d.status = 'queued' AND s.status = 'confirmed'
     ORDER BY d.subscriber_id LIMIT ${Math.min(100, Math.max(1, limit))}`,
    [newsletterId],
  );
  return rows.map(toSubscriber);
}

/** Records one delivery; the newsletter is "sent" once nothing is queued any more. */
export async function markDelivery(
  db: Db,
  newsletterId: number,
  subscriberId: number,
  ok: boolean,
): Promise<void> {
  const res = await db.execute(
    "UPDATE newsletter_deliveries SET status = ?, sent_at = UTC_TIMESTAMP() WHERE newsletter_id = ? AND subscriber_id = ? AND status = 'queued'",
    [ok ? 'sent' : 'failed', newsletterId, subscriberId],
  );
  if (res.affectedRows === 0) return;
  await db.execute(
    ok
      ? 'UPDATE newsletters SET sent_count = sent_count + 1 WHERE id = ?'
      : 'UPDATE newsletters SET failed_count = failed_count + 1 WHERE id = ?',
    [newsletterId],
  );
}

/** Closes newsletters with nothing left in the queue. */
export async function finishNewsletters(db: Db): Promise<void> {
  await db.execute(
    `UPDATE newsletters n SET n.status = 'sent'
     WHERE n.status = 'sending' AND NOT EXISTS (
       SELECT 1 FROM newsletter_deliveries d JOIN subscribers s ON s.id = d.subscriber_id
       WHERE d.newsletter_id = n.id AND d.status = 'queued' AND s.status = 'confirmed')`,
  );
}

/** Newsletters still being sent (for the hourly job). */
export async function sendingNewsletters(db: Db): Promise<Array<{ id: number; storeId: number }>> {
  const rows = await db.query<{ id: number; store_id: number }>(
    "SELECT id, store_id FROM newsletters WHERE status = 'sending' ORDER BY id LIMIT 20",
  );
  return rows.map((r) => ({ id: num(r.id), storeId: num(r.store_id) }));
}
