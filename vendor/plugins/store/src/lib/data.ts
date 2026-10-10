import { randomInt } from 'node:crypto';
import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { ItemSnapshot, SellableVariant } from './checkout';
import { HttpError } from './http';
import {
  LIMITS,
  newOrderCode,
  nextStatuses,
  type ProductSort,
  type CarrierCode,
  type OrderStatus,
  type PaymentMethod,
} from './model';
import { campaignFor, isLive, type CampaignRule } from './marketing';
import { PICTURE_SQL, thumbParams, thumbValues, type Picture } from './picture';
import { priceNow, type Totals, type Zone } from './pricing';
import type { ReviewMode } from './reviews';
import { parseRoles, type Role } from './roles';
import { openSecret, sealSecret } from './secrets';
import { parseTheme, type Theme } from './theme';
import { storedTracking, type Tracking } from './tracking';

// Everything the store keeps, in its own database (ADR 0007, 0057). SQL with ? placeholders
// only. Every query names the store, so one store never sees another's rows.

type Db = Omit<PluginDatabase, 'transaction'>;

const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);
const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(',');

// ---------------------------------------------------------------------------------------------
// Stores

export interface Store {
  id: number;
  ownerUserId: number;
  slug: string;
  name: string;
  tagline: string | null;
  about: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  /** The owner's design; null: the app's own look (light and dark). */
  theme: Theme | null;
  /** Tracking tags and verification codes (owner only); null when none are set. */
  tracking: Tracking | null;
  reviewsMode: ReviewMode;
  /** Closed for maintenance: buyers see the message instead of the shop. */
  maintenance: boolean;
  maintenanceMessage: string | null;
  /** The shop's own language buyers see first (store_languages code); null: the visitor's. */
  defaultLanguage: string | null;
  /** Versions of the logo and banner (for their addresses); null when there is none. */
  logoVersion: number | null;
  bannerVersion: number | null;
  currency: string;
  vatRate: number;
  published: boolean;
  seller: {
    companyName: string | null;
    companyNumber: string | null;
    vatNumber: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
  };
  terms: string | null;
  returnsPolicy: string | null;
  showAnpc: boolean;
  cod: { enabled: boolean; feeCents: number };
  bank: { enabled: boolean; holder: string | null; iban: string | null; bankName: string | null };
  /** Whether each secret is stored; the secrets themselves only through storeSecrets(). */
  stripe: { enabled: boolean; hasSecret: boolean; hasWebhook: boolean };
  paypal: { enabled: boolean; live: boolean; clientId: string | null; hasSecret: boolean };
}

type StoreRow = Record<string, unknown>;

function toStore(r: StoreRow): Store {
  return {
    id: num(r.id),
    ownerUserId: num(r.owner_user_id),
    slug: String(r.slug),
    name: String(r.name),
    tagline: (r.tagline as string | null) ?? null,
    about: (r.about as string | null) ?? null,
    seoTitle: (r.seo_title as string | null) ?? null,
    seoDescription: (r.seo_description as string | null) ?? null,
    theme: parseTheme(r.theme ?? null),
    tracking: storedTracking(r.tracking),
    reviewsMode: (r.reviews_mode as ReviewMode | undefined) ?? 'moderated',
    maintenance: Boolean(r.maintenance),
    maintenanceMessage: (r.maintenance_message as string | null) ?? null,
    defaultLanguage: (r.default_language as string | null) ?? null,
    logoVersion: r.logo_v === null || r.logo_v === undefined ? null : num(r.logo_v),
    bannerVersion: r.banner_v === null || r.banner_v === undefined ? null : num(r.banner_v),
    currency: String(r.currency),
    vatRate: num(r.vat_rate),
    published: Boolean(r.published),
    seller: {
      companyName: (r.company_name as string | null) ?? null,
      companyNumber: (r.company_number as string | null) ?? null,
      vatNumber: (r.vat_number as string | null) ?? null,
      address: (r.address as string | null) ?? null,
      email: (r.contact_email as string | null) ?? null,
      phone: (r.contact_phone as string | null) ?? null,
    },
    terms: (r.terms as string | null) ?? null,
    returnsPolicy: (r.returns_policy as string | null) ?? null,
    showAnpc: Boolean(r.show_anpc),
    cod: { enabled: Boolean(r.cod_enabled), feeCents: num(r.cod_fee_cents) },
    bank: {
      enabled: Boolean(r.bank_enabled),
      holder: (r.bank_holder as string | null) ?? null,
      iban: (r.bank_iban as string | null) ?? null,
      bankName: (r.bank_name as string | null) ?? null,
    },
    stripe: {
      enabled: Boolean(r.stripe_enabled),
      hasSecret: Boolean(r.stripe_secret),
      hasWebhook: Boolean(r.stripe_webhook),
    },
    paypal: {
      enabled: Boolean(r.paypal_enabled),
      live: Boolean(r.paypal_live),
      clientId: (r.paypal_client_id as string | null) ?? null,
      hasSecret: Boolean(r.paypal_secret),
    },
  };
}

/** The payment methods a buyer can choose now (a provider also needs its secrets). */
export function methodsOf(store: Store): PaymentMethod[] {
  const out: PaymentMethod[] = [];
  if (store.stripe.enabled && store.stripe.hasSecret && store.stripe.hasWebhook) out.push('stripe');
  if (store.paypal.enabled && store.paypal.clientId && store.paypal.hasSecret) out.push('paypal');
  if (store.bank.enabled && store.bank.iban && store.bank.holder) out.push('bank');
  if (store.cod.enabled) out.push('cod');
  return out;
}

// A store with the versions of its logo and banner.
const STORE_SQL = `SELECT s.*,
  (SELECT UNIX_TIMESTAMP(a.updated_at) FROM store_assets a WHERE a.store_id = s.id AND a.kind = 'logo') AS logo_v,
  (SELECT UNIX_TIMESTAMP(a.updated_at) FROM store_assets a WHERE a.store_id = s.id AND a.kind = 'banner') AS banner_v
  FROM stores s`;

// A store with the member's roles in its team.
const MEMBER_SQL = STORE_SQL.replace(
  'FROM stores s',
  ', st.roles AS staff_roles FROM stores s JOIN store_staff st ON st.store_id = s.id',
);

export async function storeOfOwner(db: Db, userId: number): Promise<Store | null> {
  const [r] = await db.query<StoreRow>(`${STORE_SQL} WHERE s.owner_user_id = ?`, [userId]);
  return r ? toStore(r) : null;
}

/** The store a member works on, as its owner or on its team, and their roles there. */
export async function storeOfMember(
  db: Db,
  userId: number,
): Promise<{ store: Store; roles: Role[] } | null> {
  const own = await storeOfOwner(db, userId);
  if (own) return { store: own, roles: ['owner'] };
  const [r] = await db.query<StoreRow & { staff_roles: string }>(
    `${MEMBER_SQL} WHERE st.user_id = ?`,
    [userId],
  );
  return r ? { store: toStore(r), roles: parseRoles(r.staff_roles) } : null;
}

export async function storeById(db: Db, storeId: number): Promise<Store | null> {
  const [r] = await db.query<StoreRow>(`${STORE_SQL} WHERE s.id = ?`, [storeId]);
  return r ? toStore(r) : null;
}

export async function storeBySlug(db: Db, slug: string): Promise<Store | null> {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  const [r] = await db.query<StoreRow>(`${STORE_SQL} WHERE s.slug = ?`, [slug]);
  return r ? toStore(r) : null;
}

/** Published stores, oldest first (the instance's root shows the first). */
export async function publishedStores(
  db: Db,
): Promise<Array<{ slug: string; name: string; updatedAt: string | null }>> {
  const rows = await db.query<{ slug: string; name: string; updated_at: Date }>(
    'SELECT slug, name, updated_at FROM stores WHERE published = 1 ORDER BY id LIMIT 500',
  );
  return rows.map((r) => ({ slug: r.slug, name: r.name, updatedAt: iso(r.updated_at) }));
}

/** The decrypted provider secrets (server only, never sent to a browser). */
export async function storeSecrets(db: Db, storeId: number) {
  const [r] = await db.query<{
    stripe_secret: string | null;
    stripe_webhook: string | null;
    paypal_secret: string | null;
  }>('SELECT stripe_secret, stripe_webhook, paypal_secret FROM stores WHERE id = ?', [storeId]);
  return {
    stripeSecret: openSecret(r?.stripe_secret ?? null),
    stripeWebhook: openSecret(r?.stripe_webhook ?? null),
    paypalSecret: openSecret(r?.paypal_secret ?? null),
  };
}

export interface StoreInput {
  name: string;
  slug: string;
  tagline: string | null;
  about: string | null;
  currency: string;
  vatRate: number;
  published: boolean;
}

export async function updateSeo(
  db: Db,
  storeId: number,
  input: { seoTitle: string | null; seoDescription: string | null },
): Promise<void> {
  await db.execute('UPDATE stores SET seo_title = ?, seo_description = ? WHERE id = ?', [
    input.seoTitle,
    input.seoDescription,
    storeId,
  ]);
}

/** The shop's design; null goes back to the app's own look. */
export async function updateTheme(db: Db, storeId: number, theme: Theme | null): Promise<void> {
  await db.execute('UPDATE stores SET theme = ? WHERE id = ?', [
    theme ? JSON.stringify(theme) : null,
    storeId,
  ]);
}

/** The shop's tracking tags and verification codes (checked by parseTracking). */
export async function updateTracking(db: Db, storeId: number, tracking: Tracking): Promise<void> {
  const empty = Object.values(tracking).every((v) => v === null);
  await db.execute('UPDATE stores SET tracking = ? WHERE id = ?', [
    empty ? null : JSON.stringify(tracking),
    storeId,
  ]);
}

/** Maintenance mode: buyers see the message instead of the shop; checkout is closed. */
export async function updateMaintenance(
  db: Db,
  storeId: number,
  input: { on: boolean; message: string | null },
): Promise<void> {
  await db.execute('UPDATE stores SET maintenance = ?, maintenance_message = ? WHERE id = ?', [
    input.on ? 1 : 0,
    input.message,
    storeId,
  ]);
}

export async function updateReviewsMode(db: Db, storeId: number, mode: ReviewMode): Promise<void> {
  await db.execute('UPDATE stores SET reviews_mode = ? WHERE id = ?', [mode, storeId]);
}

export type AssetKind = 'logo' | 'banner';
export const isAssetKind = (v: unknown): v is AssetKind => v === 'logo' || v === 'banner';

/** Replaces the shop's logo or banner (already checked and shrunk). */
export async function saveAsset(
  db: Db,
  storeId: number,
  kind: AssetKind,
  picture: { mime: string; data: Uint8Array },
): Promise<void> {
  await db.execute(
    `INSERT INTO store_assets (store_id, kind, mime, data, bytes) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data), bytes = VALUES(bytes), updated_at = CURRENT_TIMESTAMP`,
    [storeId, kind, picture.mime, Buffer.from(picture.data), picture.data.length],
  );
}

export async function deleteAsset(db: Db, storeId: number, kind: AssetKind): Promise<void> {
  await db.execute('DELETE FROM store_assets WHERE store_id = ? AND kind = ?', [storeId, kind]);
}

export async function readAsset(
  db: Db,
  storeId: number,
  kind: AssetKind,
): Promise<{ mime: string; data: Buffer } | null> {
  const [r] = await db.query<{ mime: string; data: Buffer }>(
    'SELECT mime, data FROM store_assets WHERE store_id = ? AND kind = ?',
    [storeId, kind],
  );
  return r ?? null;
}

async function slugTaken(db: Db, slug: string, exceptId: number | null) {
  const rows = await db.query<{ id: number }>('SELECT id FROM stores WHERE slug = ?', [slug]);
  return rows.some((r) => num(r.id) !== exceptId);
}

export async function createStore(db: Db, userId: number, input: StoreInput): Promise<number> {
  if (await storeOfOwner(db, userId)) throw new HttpError(409, 'oneStore');
  if (await slugTaken(db, input.slug, null)) throw new HttpError(409, 'slugTaken');
  const res = await db.execute(
    `INSERT INTO stores (owner_user_id, slug, name, tagline, about, currency, vat_rate, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      input.slug,
      input.name,
      input.tagline,
      input.about,
      input.currency,
      input.vatRate,
      input.published ? 1 : 0,
    ],
  );
  return res.insertId;
}

export async function updateStore(db: Db, storeId: number, input: StoreInput): Promise<void> {
  if (await slugTaken(db, input.slug, storeId)) throw new HttpError(409, 'slugTaken');
  const [{ orders } = { orders: 0 }] = await db.query<{ orders: number }>(
    'SELECT COUNT(*) AS orders FROM orders WHERE store_id = ?',
    [storeId],
  );
  const [current] = await db.query<{ currency: string }>(
    'SELECT currency FROM stores WHERE id = ?',
    [storeId],
  );
  if (num(orders) > 0 && current && current.currency !== input.currency) {
    throw new HttpError(409, 'currencyLocked');
  }
  await db.execute(
    `UPDATE stores SET slug = ?, name = ?, tagline = ?, about = ?, currency = ?, vat_rate = ?, published = ?
     WHERE id = ?`,
    [
      input.slug,
      input.name,
      input.tagline,
      input.about,
      input.currency,
      input.vatRate,
      input.published ? 1 : 0,
      storeId,
    ],
  );
}

export interface LegalInput {
  companyName: string | null;
  companyNumber: string | null;
  vatNumber: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  terms: string | null;
  returnsPolicy: string | null;
  showAnpc: boolean;
}

export async function updateLegal(db: Db, storeId: number, input: LegalInput): Promise<void> {
  await db.execute(
    `UPDATE stores SET company_name = ?, company_number = ?, vat_number = ?, address = ?,
       contact_email = ?, contact_phone = ?, terms = ?, returns_policy = ?, show_anpc = ?
     WHERE id = ?`,
    [
      input.companyName,
      input.companyNumber,
      input.vatNumber,
      input.address,
      input.email,
      input.phone,
      input.terms,
      input.returnsPolicy,
      input.showAnpc ? 1 : 0,
      storeId,
    ],
  );
}

/** A secret field: a new value, '' to remove it, or undefined to keep the stored one. */
export type SecretChange = string | undefined;

export interface PaymentsInput {
  cod: { enabled: boolean; feeCents: number };
  bank: { enabled: boolean; holder: string | null; iban: string | null; bankName: string | null };
  stripe: { enabled: boolean; secret: SecretChange; webhook: SecretChange };
  paypal: { enabled: boolean; live: boolean; clientId: string | null; secret: SecretChange };
}

export async function updatePayments(db: Db, storeId: number, input: PaymentsInput): Promise<void> {
  const sets = [
    'cod_enabled = ?',
    'cod_fee_cents = ?',
    'bank_enabled = ?',
    'bank_holder = ?',
    'bank_iban = ?',
    'bank_name = ?',
    'stripe_enabled = ?',
    'paypal_enabled = ?',
    'paypal_live = ?',
    'paypal_client_id = ?',
  ];
  const values: unknown[] = [
    input.cod.enabled ? 1 : 0,
    input.cod.feeCents,
    input.bank.enabled ? 1 : 0,
    input.bank.holder,
    input.bank.iban,
    input.bank.bankName,
    input.stripe.enabled ? 1 : 0,
    input.paypal.enabled ? 1 : 0,
    input.paypal.live ? 1 : 0,
    input.paypal.clientId,
  ];
  const secret = (column: string, change: SecretChange) => {
    if (change === undefined) return;
    sets.push(`${column} = ?`);
    values.push(change === '' ? null : sealSecret(change));
  };
  secret('stripe_secret', input.stripe.secret);
  secret('stripe_webhook', input.stripe.webhook);
  secret('paypal_secret', input.paypal.secret);
  await db.execute(`UPDATE stores SET ${sets.join(', ')} WHERE id = ?`, [...values, storeId]);
}

// ---------------------------------------------------------------------------------------------
// Shipping zones

export async function zonesOf(db: Db, storeId: number): Promise<Zone[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    countries: string;
    rate_cents: number;
    free_from_cents: number | null;
  }>(
    'SELECT id, name, countries, rate_cents, free_from_cents FROM shipping_zones WHERE store_id = ? ORDER BY position, id',
    [storeId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    name: r.name,
    countries: r.countries.split(',').filter(Boolean),
    rateCents: num(r.rate_cents),
    freeFromCents: r.free_from_cents === null ? null : num(r.free_from_cents),
  }));
}

/** Replaces the store's zones with these, in this order. */
export async function saveZones(
  db: PluginDatabase,
  storeId: number,
  zones: Omit<Zone, 'id'>[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute('DELETE FROM shipping_zones WHERE store_id = ?', [storeId]);
    let position = 0;
    for (const z of zones) {
      await tx.execute(
        'INSERT INTO shipping_zones (store_id, name, countries, rate_cents, free_from_cents, position) VALUES (?, ?, ?, ?, ?, ?)',
        [storeId, z.name, z.countries.join(','), z.rateCents, z.freeFromCents, position++],
      );
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Campaigns (the prices they make; the owner's lists are in marketing-data.ts)

/** The store's switched-on campaigns that have not ended, with their chosen products. */
export async function campaignRules(db: Db, storeId: number, now: Date): Promise<CampaignRule[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    percent_off: number;
    scope: CampaignRule['scope'];
    category: string | null;
    starts_at: Date | null;
    ends_at: Date | null;
    active: number;
  }>(
    `SELECT id, name, percent_off, scope, category, starts_at, ends_at, active FROM campaigns
     WHERE store_id = ? AND active = 1 AND (ends_at IS NULL OR ends_at > ?) ORDER BY id LIMIT 100`,
    [storeId, now],
  );
  if (rows.length === 0) return [];
  const picked = await db.query<{ campaign_id: number; product_id: number }>(
    `SELECT campaign_id, product_id FROM campaign_products WHERE campaign_id IN (${placeholders(rows.length)})`,
    rows.map((r) => r.id),
  );
  return rows.map((r) => ({
    id: num(r.id),
    name: r.name,
    percentOff: num(r.percent_off),
    scope: r.scope,
    category: r.category,
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    active: Boolean(r.active),
    productIds: picked
      .filter((x) => num(x.campaign_id) === num(r.id))
      .map((x) => num(x.product_id)),
  }));
}

/** A product's running campaign as the shop shows it. */
export interface ProductCampaign {
  id: number;
  name: string;
  percentOff: number;
  endsAt: string | null;
}

function campaignOf(
  product: { id: number; category: string | null },
  rules: CampaignRule[],
  now: Date,
): ProductCampaign | null {
  const c = campaignFor(product, rules, now);
  return c ? { id: c.id, name: c.name, percentOff: c.percentOff, endsAt: c.endsAt } : null;
}

// ---------------------------------------------------------------------------------------------
// Products, variants, photos

export interface Variant {
  id: number;
  name: string;
  sku: string | null;
  priceCents: number;
  saleCents: number | null;
  saleFrom: string | null;
  saleUntil: string | null;
  stock: number | null;
}

export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  summary: string | null;
  category: string | null;
  published: boolean;
  /** The lowest price now and whether a sale makes it so. */
  fromCents: number;
  regularCents: number;
  onSale: boolean;
  /** Several options with different prices ("from …"). */
  priceVaries: boolean;
  /** Stock across options; null when not counted. */
  stock: number | null;
  photoId: number | null;
  updatedAt: string | null;
  createdAt: string | null;
  typeId: number | null;
  vendorId: number | null;
  /** The vendor's name when buyers see it as the brand. */
  brand: string | null;
  /** Published reviews. */
  rating: { average: number; count: number };
  campaign: ProductCampaign | null;
}

export interface Product extends Omit<
  ProductSummary,
  'fromCents' | 'regularCents' | 'onSale' | 'priceVaries' | 'stock' | 'photoId' | 'createdAt'
> {
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  gtin: string | null;
  vatRate: number | null;
  variants: Variant[];
  photoIds: number[];
  /** Field id → stored value (product_values). */
  values: Record<number, string>;
}

type VariantRow = {
  id: number;
  product_id: number;
  name: string;
  sku: string | null;
  price_cents: number;
  sale_cents: number | null;
  sale_from: Date | null;
  sale_until: Date | null;
  stock: number | null;
};

const toVariant = (r: VariantRow): Variant => ({
  id: num(r.id),
  name: r.name,
  sku: r.sku,
  priceCents: num(r.price_cents),
  saleCents: r.sale_cents === null ? null : num(r.sale_cents),
  saleFrom: iso(r.sale_from),
  saleUntil: iso(r.sale_until),
  stock: r.stock === null ? null : num(r.stock),
});

/** A product list's price line from its options at `now`. */
export function summarizeVariants(variants: Variant[], now: Date, campaignPercent = 0) {
  const prices = variants.map((v) => ({ v, p: priceNow(v, now, campaignPercent) }));
  const lowest = prices.reduce<(typeof prices)[number] | null>(
    (min, x) => (min === null || x.p.cents < min.p.cents ? x : min),
    null,
  );
  const counted = variants.every((v) => v.stock !== null);
  return {
    fromCents: lowest?.p.cents ?? 0,
    regularCents: lowest?.p.regularCents ?? 0,
    onSale: lowest?.p.onSale ?? false,
    priceVaries: new Set(prices.map((x) => x.p.cents)).size > 1,
    stock: counted ? variants.reduce((s, v) => s + Math.max(0, v.stock ?? 0), 0) : null,
  };
}

export { PRODUCT_SORTS, type ProductSort } from './model';

export interface ProductFilter {
  publishedOnly: boolean;
  category?: string | null;
  /** Words in the name, summary, code or brand. */
  search?: string | null;
  typeId?: number | null;
  vendorId?: number | null;
  /** Only products of this running campaign. */
  campaignId?: number | null;
  /** Owner's lists: 'draft' or 'published'. */
  status?: 'draft' | 'published' | null;
  ids?: number[];
  slugs?: string[];
  sort?: ProductSort;
  now?: Date;
}

export async function listProducts(
  db: Db,
  storeId: number,
  options: ProductFilter,
): Promise<ProductSummary[]> {
  const where = ['p.store_id = ?'];
  const params: unknown[] = [storeId];
  if (options.publishedOnly || options.status === 'published') where.push('p.published = 1');
  if (options.status === 'draft') where.push('p.published = 0');
  if (options.category) {
    where.push('p.category = ?');
    params.push(options.category);
  }
  if (options.typeId) {
    where.push('p.type_id = ?');
    params.push(options.typeId);
  }
  if (options.vendorId) {
    where.push('p.vendor_id = ?');
    params.push(options.vendorId);
  }
  if (options.search) {
    const like = `%${options.search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.push(
      '(p.name LIKE ? OR p.summary LIKE ? OR ven.name LIKE ? OR EXISTS (SELECT 1 FROM variants sv WHERE sv.product_id = p.id AND sv.sku LIKE ?))',
    );
    params.push(like, like, like, like);
  }
  if (options.ids) {
    if (options.ids.length === 0) return [];
    where.push(`p.id IN (${placeholders(options.ids.length)})`);
    params.push(...options.ids);
  }
  if (options.slugs) {
    if (options.slugs.length === 0) return [];
    where.push(`p.slug IN (${placeholders(options.slugs.length)})`);
    params.push(...options.slugs);
  }
  const whereSql = where.join(' AND ');
  const orderSql = options.sort === 'newest' ? 'p.created_at DESC, p.id DESC' : 'p.position, p.id';
  const rows = await db.query<{
    id: number;
    slug: string;
    name: string;
    summary: string | null;
    category: string | null;
    published: number;
    updated_at: Date;
    created_at: Date;
    photo_id: number | null;
    type_id: number | null;
    vendor_id: number | null;
    vendor_name: string | null;
    vendor_brand: number | null;
    rating_avg: string | number | null;
    rating_count: number | string;
  }>(
    // sql-safe: whereSql, orderSql — fixed fragments above; every value is a ? parameter
    `SELECT p.id, p.slug, p.name, p.summary, p.category, p.published, p.updated_at, p.created_at, p.type_id, p.vendor_id,
            ven.name AS vendor_name, ven.is_brand AS vendor_brand,
            (SELECT ph.id FROM product_photos ph WHERE ph.product_id = p.id ORDER BY ph.position, ph.id LIMIT 1) AS photo_id,
            (SELECT AVG(rv.rating) FROM reviews rv WHERE rv.product_id = p.id AND rv.status = 'published') AS rating_avg,
            (SELECT COUNT(*) FROM reviews rv WHERE rv.product_id = p.id AND rv.status = 'published') AS rating_count
     FROM products p LEFT JOIN vendors ven ON ven.id = p.vendor_id
     WHERE ${whereSql}
     ORDER BY ${orderSql} LIMIT ${LIMITS.productsPerStore}`,
    params,
  );
  if (rows.length === 0) return [];
  const variants = await db.query<VariantRow>(
    `SELECT * FROM variants WHERE product_id IN (${placeholders(rows.length)}) ORDER BY position, id`,
    rows.map((r) => r.id),
  );
  const now = options.now ?? new Date();
  const rules = await campaignRules(db, storeId, now);
  const list: ProductSummary[] = rows.map((r) => {
    const mine = variants.filter((v) => num(v.product_id) === num(r.id)).map(toVariant);
    const campaign = campaignOf({ id: num(r.id), category: r.category }, rules, now);
    return {
      id: num(r.id),
      slug: r.slug,
      name: r.name,
      summary: r.summary,
      category: r.category,
      published: Boolean(r.published),
      photoId: r.photo_id === null ? null : num(r.photo_id),
      updatedAt: iso(r.updated_at),
      createdAt: iso(r.created_at),
      typeId: r.type_id === null ? null : num(r.type_id),
      vendorId: r.vendor_id === null ? null : num(r.vendor_id),
      brand: r.vendor_brand ? r.vendor_name : null,
      rating: {
        average: r.rating_avg === null ? 0 : Math.round(Number(r.rating_avg) * 10) / 10,
        count: num(r.rating_count),
      },
      campaign,
      ...summarizeVariants(mine, now, campaign?.percentOff ?? 0),
    };
  });
  const shown = options.campaignId
    ? list.filter((p) => p.campaign?.id === options.campaignId)
    : list;
  if (options.sort === 'priceLow') shown.sort((a, b) => a.fromCents - b.fromCents);
  if (options.sort === 'priceHigh') shown.sort((a, b) => b.fromCents - a.fromCents);
  if (options.sort === 'rating')
    shown.sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count);
  return shown;
}

export async function categoriesOf(
  db: Db,
  storeId: number,
  publishedOnly: boolean,
): Promise<string[]> {
  const rows = await db.query<{ category: string }>(
    `SELECT DISTINCT category FROM products
     WHERE store_id = ? AND category IS NOT NULL ${publishedOnly ? 'AND published = 1' : ''}
     ORDER BY category LIMIT 100`,
    [storeId],
  );
  return rows.map((r) => r.category);
}

async function loadProduct(db: Db, storeId: number, column: 'id' | 'slug', value: number | string) {
  const [r] = await db.query<Record<string, unknown>>(
    `SELECT p.*, ven.name AS vendor_name, ven.is_brand AS vendor_brand,
       (SELECT AVG(rv.rating) FROM reviews rv WHERE rv.product_id = p.id AND rv.status = 'published') AS rating_avg,
       (SELECT COUNT(*) FROM reviews rv WHERE rv.product_id = p.id AND rv.status = 'published') AS rating_count
     FROM products p LEFT JOIN vendors ven ON ven.id = p.vendor_id
     WHERE p.store_id = ? AND ${column === 'id' ? 'p.id' : 'p.slug'} = ?`,
    [storeId, value],
  );
  if (!r) return null;
  const id = num(r.id);
  const variants = await db.query<VariantRow>(
    'SELECT * FROM variants WHERE product_id = ? ORDER BY position, id',
    [id],
  );
  const photos = await db.query<{ id: number }>(
    'SELECT id FROM product_photos WHERE product_id = ? ORDER BY position, id',
    [id],
  );
  const values = await db.query<{ field_id: number; value: string }>(
    'SELECT field_id, value FROM product_values WHERE product_id = ?',
    [id],
  );
  const category = (r.category as string | null) ?? null;
  const now = new Date();
  const product: Product = {
    id,
    slug: String(r.slug),
    name: String(r.name),
    summary: (r.summary as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    seoTitle: (r.seo_title as string | null) ?? null,
    seoDescription: (r.seo_description as string | null) ?? null,
    gtin: (r.gtin as string | null) ?? null,
    category,
    typeId: r.type_id === null || r.type_id === undefined ? null : num(r.type_id),
    vendorId: r.vendor_id === null || r.vendor_id === undefined ? null : num(r.vendor_id),
    brand: r.vendor_brand ? ((r.vendor_name as string | null) ?? null) : null,
    rating: {
      average:
        r.rating_avg === null || r.rating_avg === undefined
          ? 0
          : Math.round(Number(r.rating_avg) * 10) / 10,
      count: num(r.rating_count),
    },
    campaign: campaignOf({ id, category }, await campaignRules(db, storeId, now), now),
    vatRate: r.vat_rate === null ? null : num(r.vat_rate),
    published: Boolean(r.published),
    updatedAt: iso(r.updated_at),
    variants: variants.map(toVariant),
    photoIds: photos.map((p) => num(p.id)),
    values: Object.fromEntries(values.map((v) => [num(v.field_id), v.value])),
  };
  return product;
}

export const productById = (db: Db, storeId: number, id: number) =>
  loadProduct(db, storeId, 'id', id);

export const productBySlug = (db: Db, storeId: number, slug: string) =>
  /^[a-z0-9-]{1,80}$/.test(slug) ? loadProduct(db, storeId, 'slug', slug) : Promise.resolve(null);

export interface VariantInput {
  /** An existing option to change; new options have none. */
  id: number | null;
  name: string;
  sku: string | null;
  priceCents: number;
  saleCents: number | null;
  saleFrom: Date | null;
  saleUntil: Date | null;
  stock: number | null;
}

export interface ProductInput {
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  gtin: string | null;
  category: string | null;
  typeId: number | null;
  vendorId: number | null;
  vatRate: number | null;
  published: boolean;
  variants: VariantInput[];
  /** Field id → checked value ('' removes it); only the type's own fields. */
  values: Record<number, string>;
}

/** Saves the product's field values; values of fields not of its type are dropped. */
async function writeValues(
  tx: Db,
  productId: number,
  typeId: number | null,
  values: Record<number, string>,
): Promise<void> {
  if (typeId === null) {
    await tx.execute('DELETE FROM product_values WHERE product_id = ?', [productId]);
    return;
  }
  await tx.execute(
    'DELETE pv FROM product_values pv JOIN product_fields f ON f.id = pv.field_id WHERE pv.product_id = ? AND f.type_id <> ?',
    [productId, typeId],
  );
  for (const [fieldId, value] of Object.entries(values)) {
    if (value === '') {
      await tx.execute('DELETE FROM product_values WHERE product_id = ? AND field_id = ?', [
        productId,
        Number(fieldId),
      ]);
    } else {
      await tx.execute(
        'INSERT INTO product_values (product_id, field_id, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
        [productId, Number(fieldId), value],
      );
    }
  }
}

async function productSlugTaken(db: Db, storeId: number, slug: string, exceptId: number | null) {
  const rows = await db.query<{ id: number }>(
    'SELECT id FROM products WHERE store_id = ? AND slug = ?',
    [storeId, slug],
  );
  return rows.some((r) => num(r.id) !== exceptId);
}

/** Saves the options in this order; answers their ids in the same order. */
async function writeVariants(
  tx: Db,
  storeId: number,
  productId: number,
  variants: VariantInput[],
): Promise<number[]> {
  const existing = await tx.query<{ id: number }>('SELECT id FROM variants WHERE product_id = ?', [
    productId,
  ]);
  const known = new Set(existing.map((r) => num(r.id)));
  const kept = new Set<number>();
  const ids: number[] = [];
  let position = 0;
  for (const v of variants) {
    const values = [
      v.name,
      v.sku,
      v.priceCents,
      v.saleCents,
      v.saleFrom,
      v.saleUntil,
      v.stock,
      position++,
    ];
    if (v.id !== null && known.has(v.id)) {
      kept.add(v.id);
      ids.push(v.id);
      await tx.execute(
        `UPDATE variants SET name = ?, sku = ?, price_cents = ?, sale_cents = ?, sale_from = ?, sale_until = ?, stock = ?, position = ?
         WHERE id = ? AND product_id = ?`,
        [...values, v.id, productId],
      );
    } else {
      const res = await tx.execute(
        `INSERT INTO variants (name, sku, price_cents, sale_cents, sale_from, sale_until, stock, position, product_id, store_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...values, productId, storeId],
      );
      ids.push(res.insertId);
    }
  }
  const gone = [...known].filter((id) => !kept.has(id));
  if (gone.length > 0) {
    await tx.execute(
      `DELETE FROM variants WHERE product_id = ? AND id IN (${placeholders(gone.length)})`,
      [productId, ...gone],
    );
  }
  return ids;
}

export async function createProduct(
  db: PluginDatabase,
  storeId: number,
  input: ProductInput,
): Promise<number> {
  const [{ n } = { n: 0 }] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM products WHERE store_id = ?',
    [storeId],
  );
  if (num(n) >= LIMITS.productsPerStore)
    throw new HttpError(409, 'tooManyProducts', { max: LIMITS.productsPerStore });
  if (await productSlugTaken(db, storeId, input.slug, null))
    throw new HttpError(409, 'productSlugTaken');
  return db.transaction(async (tx) => {
    const [{ last } = { last: 0 }] = await tx.query<{ last: number | null }>(
      'SELECT MAX(position) AS last FROM products WHERE store_id = ?',
      [storeId],
    );
    const res = await tx.execute(
      `INSERT INTO products (store_id, slug, name, summary, description, seo_title, seo_description, gtin, category, type_id, vendor_id, vat_rate, published, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        storeId,
        input.slug,
        input.name,
        input.summary,
        input.description,
        input.seoTitle,
        input.seoDescription,
        input.gtin,
        input.category,
        input.typeId,
        input.vendorId,
        input.vatRate,
        input.published ? 1 : 0,
        num(last) + 1,
      ],
    );
    await writeVariants(tx, storeId, res.insertId, input.variants);
    await writeValues(tx, res.insertId, input.typeId, input.values);
    return res.insertId;
  });
}

export async function updateProduct(
  db: PluginDatabase,
  storeId: number,
  productId: number,
  input: ProductInput,
): Promise<number[]> {
  if (await productSlugTaken(db, storeId, input.slug, productId))
    throw new HttpError(409, 'productSlugTaken');
  return db.transaction(async (tx) => {
    // Unchanged rows may count as not affected: check that the product is there first.
    const [found] = await tx.query<{ id: number }>(
      'SELECT id FROM products WHERE id = ? AND store_id = ? FOR UPDATE',
      [productId, storeId],
    );
    if (!found) throw new HttpError(404, 'productNotFound');
    await tx.execute(
      `UPDATE products SET slug = ?, name = ?, summary = ?, description = ?, seo_title = ?, seo_description = ?, gtin = ?,
         category = ?, type_id = ?, vendor_id = ?, vat_rate = ?, published = ?
       WHERE id = ? AND store_id = ?`,
      [
        input.slug,
        input.name,
        input.summary,
        input.description,
        input.seoTitle,
        input.seoDescription,
        input.gtin,
        input.category,
        input.typeId,
        input.vendorId,
        input.vatRate,
        input.published ? 1 : 0,
        productId,
        storeId,
      ],
    );
    const ids = await writeVariants(tx, storeId, productId, input.variants);
    await writeValues(tx, productId, input.typeId, input.values);
    return ids;
  });
}

/** Bulk changes from the product list: open or close for sale, or delete. */
export async function bulkProducts(
  db: Db,
  storeId: number,
  ids: number[],
  action: 'publish' | 'unpublish' | 'delete',
): Promise<number> {
  if (ids.length === 0) return 0;
  const res =
    action === 'delete'
      ? await db.execute(
          `DELETE FROM products WHERE store_id = ? AND id IN (${placeholders(ids.length)})`,
          [storeId, ...ids],
        )
      : await db.execute(
          `UPDATE products SET published = ? WHERE store_id = ? AND id IN (${placeholders(ids.length)})`,
          [action === 'publish' ? 1 : 0, storeId, ...ids],
        );
  return res.affectedRows;
}

/** A copy of the product as a draft (options and field values; photos stay with the original). */
export async function duplicateProduct(
  db: PluginDatabase,
  storeId: number,
  productId: number,
  copyName: (name: string) => string,
): Promise<number> {
  const product = await productById(db, storeId, productId);
  if (!product) throw new HttpError(404, 'productNotFound');
  let n = 2;
  let slug = `${product.slug.slice(0, 76)}-${n}`;
  while (await productSlugTaken(db, storeId, slug, null)) {
    n += 1;
    slug = `${product.slug.slice(0, 74)}-${n}`;
  }
  return createProduct(db, storeId, {
    name: copyName(product.name).slice(0, LIMITS.productName),
    slug,
    summary: product.summary,
    description: product.description,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    gtin: null,
    category: product.category,
    typeId: product.typeId,
    vendorId: product.vendorId,
    vatRate: product.vatRate,
    published: false,
    variants: product.variants.map((v) => ({
      id: null,
      name: v.name,
      sku: null,
      priceCents: v.priceCents,
      saleCents: v.saleCents,
      saleFrom: v.saleFrom ? new Date(v.saleFrom) : null,
      saleUntil: v.saleUntil ? new Date(v.saleUntil) : null,
      stock: v.stock,
    })),
    values: product.values,
  });
}

export async function deleteProduct(db: Db, storeId: number, productId: number): Promise<void> {
  const res = await db.execute('DELETE FROM products WHERE id = ? AND store_id = ?', [
    productId,
    storeId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'productNotFound');
}

export async function addPhoto(
  db: Db,
  storeId: number,
  productId: number,
  picture: Picture,
): Promise<number> {
  const [p] = await db.query<{ n: number }>(
    `SELECT (SELECT COUNT(*) FROM product_photos WHERE product_id = p.id) AS n
     FROM products p WHERE p.id = ? AND p.store_id = ?`,
    [productId, storeId],
  );
  if (!p) throw new HttpError(404, 'productNotFound');
  if (num(p.n) >= LIMITS.photosPerProduct)
    throw new HttpError(409, 'tooManyPhotos', { max: LIMITS.photosPerProduct });
  const [thumbMime, thumb] = thumbValues(picture);
  const res = await db.execute(
    `INSERT INTO product_photos (product_id, store_id, mime, data, thumb_mime, thumb, bytes, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      productId,
      storeId,
      picture.mime,
      Buffer.from(picture.data),
      thumbMime,
      thumb,
      picture.data.length,
      num(p.n),
    ],
  );
  await db.execute('UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [productId]);
  return res.insertId;
}

export async function deletePhoto(
  db: Db,
  storeId: number,
  productId: number,
  photoId: number,
): Promise<void> {
  const res = await db.execute(
    'DELETE FROM product_photos WHERE id = ? AND product_id = ? AND store_id = ?',
    [photoId, productId, storeId],
  );
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}

/** Makes the photo the product's first (the one lists and search engines show). */
export async function makeFirstPhoto(
  db: PluginDatabase,
  storeId: number,
  productId: number,
  photoId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    const rows = await tx.query<{ id: number }>(
      'SELECT id FROM product_photos WHERE product_id = ? AND store_id = ? ORDER BY position, id',
      [productId, storeId],
    );
    if (!rows.some((r) => num(r.id) === photoId)) throw new HttpError(404, 'notFound');
    const order = [photoId, ...rows.map((r) => num(r.id)).filter((id) => id !== photoId)];
    for (const [i, id] of order.entries()) {
      await tx.execute('UPDATE product_photos SET position = ? WHERE id = ?', [i, id]);
    }
  });
}

/** The first photo of each of these products (product id → photo id). */
export async function firstPhotos(
  db: Db,
  storeId: number,
  productIds: number[],
): Promise<Map<number, number>> {
  if (productIds.length === 0) return new Map();
  const rows = await db.query<{ product_id: number; id: number }>(
    `SELECT ph.product_id, ph.id FROM product_photos ph
     WHERE ph.store_id = ? AND ph.product_id IN (${placeholders(productIds.length)})
     ORDER BY ph.position DESC, ph.id DESC`,
    [storeId, ...productIds],
  );
  // Ordered last to first, so the first photo is the one left in the map.
  return new Map(rows.map((r) => [num(r.product_id), num(r.id)]));
}

/**
 * A product photo: the owner's own, or for anyone when its product and store are published
 * (`publicOnly`).
 */
export async function readPhoto(
  db: Db,
  photoId: number,
  where: { storeId: number; publicOnly: boolean },
  thumb: boolean,
): Promise<{ mime: string; data: Buffer } | null> {
  const [r] = await db.query<{ mime: string; data: Buffer }>(
    `SELECT ${PICTURE_SQL} FROM product_photos ph
     JOIN products p ON p.id = ph.product_id
     JOIN stores s ON s.id = ph.store_id
     WHERE ph.id = ? AND ph.store_id = ? ${where.publicOnly ? 'AND p.published = 1 AND s.published = 1' : ''}`,
    [...thumbParams(thumb), photoId, where.storeId],
  );
  return r ?? null;
}

// ---------------------------------------------------------------------------------------------
// Checkout and orders

/** The variants of a cart as checkout needs them (only this store's). */
export async function sellableVariants(
  db: Db,
  storeId: number,
  variantIds: number[],
  lock = false,
): Promise<SellableVariant[]> {
  if (variantIds.length === 0) return [];
  const rows = await db.query<
    VariantRow & {
      product_name: string;
      product_slug: string;
      published: number;
      vat_rate: string | null;
      category: string | null;
    }
  >(
    `SELECT v.*, p.name AS product_name, p.slug AS product_slug, p.published, p.vat_rate, p.category
     FROM variants v JOIN products p ON p.id = v.product_id
     WHERE v.store_id = ? AND v.id IN (${placeholders(variantIds.length)})${lock ? ' FOR UPDATE' : ''}`,
    [storeId, ...variantIds],
  );
  const now = new Date();
  const rules = await campaignRules(db, storeId, now);
  return rows.map((r) => ({
    campaignPercent:
      campaignFor({ id: num(r.product_id), category: r.category }, rules, now)?.percentOff ?? 0,
    variantId: num(r.id),
    productId: num(r.product_id),
    productName: r.product_name,
    productSlug: r.product_slug,
    optionName: r.name,
    available: Boolean(r.published),
    priceCents: num(r.price_cents),
    saleCents: r.sale_cents === null ? null : num(r.sale_cents),
    saleFrom: iso(r.sale_from),
    saleUntil: iso(r.sale_until),
    stock: r.stock === null ? null : num(r.stock),
    vatRate: r.vat_rate === null ? null : num(r.vat_rate),
  }));
}

export interface Buyer {
  name: string;
  email: string;
  phone: string | null;
  addressLine: string;
  city: string;
  postalCode: string | null;
  country: string;
  note: string | null;
}

export interface NewOrder {
  storeId: number;
  method: PaymentMethod;
  currency: string;
  totals: Totals;
  buyer: Buyer;
  zoneName: string;
  items: ItemSnapshot[];
  /** The voucher the totals used; its use is counted (and checked again) under a lock. */
  voucher: { id: number; code: string } | null;
  /** The buyer's language, for emails about the order. */
  locale: string;
  /** The automatic discount in totals.discountCents, with its text as the buyer saw it. */
  autoDiscount: { cents: number; label: string } | null;
}

/**
 * Saves the order and takes its stock in one transaction. `check` runs on the locked variants
 * (stock can change between the buyer's page and this moment) and throws to refuse.
 */
export async function placeOrder(
  db: PluginDatabase,
  order: NewOrder,
  check: (locked: SellableVariant[]) => void,
): Promise<{ id: number; code: string }> {
  return db.transaction(async (tx) => {
    const locked = await sellableVariants(
      tx,
      order.storeId,
      order.items.map((i) => i.variantId),
      true,
    );
    check(locked);
    if (order.voucher) await takeVoucher(tx, order.storeId, order.voucher.id, order.buyer.email);
    for (const item of order.items) {
      await tx.execute(
        'UPDATE variants SET stock = stock - ? WHERE id = ? AND store_id = ? AND stock IS NOT NULL',
        [item.quantity, item.variantId, order.storeId],
      );
    }
    const code = newOrderCode(randomInt);
    const b = order.buyer;
    const t = order.totals;
    const res = await tx.execute(
      `INSERT INTO orders (store_id, code, payment_method, currency, items_cents, shipping_cents, fee_cents, discount_cents, auto_discount_cents, auto_discount_label, voucher_id, voucher_code, total_cents, vat_cents,
         buyer_name, buyer_email, buyer_phone, buyer_locale, address_line, city, postal_code, country, note, shipping_zone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.storeId,
        code,
        order.method,
        order.currency,
        t.itemsCents,
        t.shippingCents,
        t.feeCents,
        t.discountCents,
        order.autoDiscount?.cents ?? 0,
        order.autoDiscount?.label.slice(0, 80) ?? null,
        order.voucher?.id ?? null,
        order.voucher?.code ?? null,
        t.totalCents,
        t.vatCents,
        b.name,
        b.email.toLowerCase(),
        b.phone,
        order.locale,
        b.addressLine,
        b.city,
        b.postalCode,
        b.country,
        b.note,
        order.zoneName,
      ],
    );
    for (const i of order.items) {
      await tx.execute(
        `INSERT INTO order_items (order_id, product_id, variant_id, name, option_name, unit_cents, vat_rate, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          res.insertId,
          i.productId,
          i.variantId,
          i.name,
          i.optionName,
          i.unitCents,
          i.vatRate,
          i.quantity,
        ],
      );
    }
    return { id: res.insertId, code };
  });
}

/**
 * Counts one use of the voucher, checked again under its lock: still live, not used up, and
 * (when it is once per buyer) not on another order of this email address.
 */
async function takeVoucher(tx: Db, storeId: number, voucherId: number, email: string) {
  const [v] = await tx.query<{
    active: number;
    starts_at: Date | null;
    ends_at: Date | null;
    max_uses: number | null;
    uses: number;
    once_per_buyer: number;
  }>(
    'SELECT active, starts_at, ends_at, max_uses, uses, once_per_buyer FROM vouchers WHERE id = ? AND store_id = ? FOR UPDATE',
    [voucherId, storeId],
  );
  const live =
    v !== undefined &&
    isLive(
      { active: Boolean(v.active), startsAt: iso(v.starts_at), endsAt: iso(v.ends_at) },
      new Date(),
    );
  if (!v || !live) throw new HttpError(409, 'voucher.notLive');
  if (v.max_uses !== null && num(v.uses) >= num(v.max_uses))
    throw new HttpError(409, 'voucher.usedUp');
  if (v.once_per_buyer) {
    const [used] = await tx.query<{ n: number }>(
      "SELECT COUNT(*) AS n FROM orders WHERE store_id = ? AND voucher_id = ? AND buyer_email = ? AND status <> 'cancelled'",
      [storeId, voucherId, email],
    );
    if (num(used?.n) > 0) throw new HttpError(409, 'voucher.usedByBuyer');
  }
  await tx.execute('UPDATE vouchers SET uses = uses + 1 WHERE id = ?', [voucherId]);
}

export interface OrderItem {
  productId: number | null;
  name: string;
  optionName: string;
  unitCents: number;
  vatRate: number;
  quantity: number;
}

export interface Order {
  id: number;
  storeId: number;
  code: string;
  status: OrderStatus;
  method: PaymentMethod;
  currency: string;
  itemsCents: number;
  shippingCents: number;
  feeCents: number;
  /** Automatic discount and voucher together. */
  discountCents: number;
  autoDiscountCents: number;
  autoDiscountLabel: string | null;
  voucherCode: string | null;
  totalCents: number;
  vatCents: number;
  buyer: Buyer;
  zoneName: string | null;
  carrier: CarrierCode | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  providerRef: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

function toOrder(r: Record<string, unknown>, items: OrderItem[]): Order {
  return {
    id: num(r.id),
    storeId: num(r.store_id),
    code: String(r.code),
    status: r.status as OrderStatus,
    method: r.payment_method as PaymentMethod,
    currency: String(r.currency),
    itemsCents: num(r.items_cents),
    shippingCents: num(r.shipping_cents),
    feeCents: num(r.fee_cents),
    discountCents: num(r.discount_cents),
    autoDiscountCents: num(r.auto_discount_cents),
    autoDiscountLabel: (r.auto_discount_label as string | null) ?? null,
    voucherCode: (r.voucher_code as string | null) ?? null,
    totalCents: num(r.total_cents),
    vatCents: num(r.vat_cents),
    buyer: {
      name: String(r.buyer_name),
      email: String(r.buyer_email),
      phone: (r.buyer_phone as string | null) ?? null,
      addressLine: String(r.address_line),
      city: String(r.city),
      postalCode: (r.postal_code as string | null) ?? null,
      country: String(r.country),
      note: (r.note as string | null) ?? null,
    },
    zoneName: (r.shipping_zone as string | null) ?? null,
    carrier: (r.carrier as CarrierCode | null) ?? null,
    trackingNumber: (r.tracking_number as string | null) ?? null,
    trackingUrl: (r.tracking_url as string | null) ?? null,
    providerRef: (r.provider_ref as string | null) ?? null,
    paidAt: iso(r.paid_at),
    shippedAt: iso(r.shipped_at),
    deliveredAt: iso(r.delivered_at),
    cancelledAt: iso(r.cancelled_at),
    createdAt: iso(r.created_at) ?? '',
    items,
  };
}

async function itemsOf(db: Db, orderId: number): Promise<OrderItem[]> {
  const rows = await db.query<{
    product_id: number | null;
    name: string;
    option_name: string;
    unit_cents: number;
    vat_rate: string;
    quantity: number;
  }>('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [orderId]);
  return rows.map((r) => ({
    productId: r.product_id === null ? null : num(r.product_id),
    name: r.name,
    optionName: r.option_name,
    unitCents: num(r.unit_cents),
    vatRate: num(r.vat_rate),
    quantity: num(r.quantity),
  }));
}

export async function orderById(db: Db, storeId: number, id: number): Promise<Order | null> {
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM orders WHERE id = ? AND store_id = ?',
    [id, storeId],
  );
  return r ? toOrder(r, await itemsOf(db, num(r.id))) : null;
}

export async function orderByCode(db: Db, storeId: number, code: string): Promise<Order | null> {
  if (!/^[A-Za-z0-9]{20}$/.test(code)) return null;
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM orders WHERE code = ? AND store_id = ?',
    [code, storeId],
  );
  return r ? toOrder(r, await itemsOf(db, num(r.id))) : null;
}

export interface OrderRow {
  id: number;
  status: OrderStatus;
  method: PaymentMethod;
  totalCents: number;
  currency: string;
  buyerName: string;
  country: string;
  createdAt: string;
  pieces: number;
}

export async function listOrders(
  db: Db,
  storeId: number,
  status: OrderStatus | null,
  limit = 200,
): Promise<OrderRow[]> {
  const rows = await db.query<{
    id: number;
    status: OrderStatus;
    payment_method: PaymentMethod;
    total_cents: number;
    currency: string;
    buyer_name: string;
    country: string;
    created_at: Date;
    pieces: number | string;
  }>(
    `SELECT o.id, o.status, o.payment_method, o.total_cents, o.currency, o.buyer_name, o.country, o.created_at,
            (SELECT COALESCE(SUM(i.quantity), 0) FROM order_items i WHERE i.order_id = o.id) AS pieces
     FROM orders o WHERE o.store_id = ? ${status ? 'AND o.status = ?' : ''}
     ORDER BY o.id DESC LIMIT ${Math.min(500, Math.max(1, limit))}`,
    status ? [storeId, status] : [storeId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    status: r.status,
    method: r.payment_method,
    totalCents: num(r.total_cents),
    currency: r.currency,
    buyerName: r.buyer_name,
    country: r.country,
    createdAt: iso(r.created_at) ?? '',
    pieces: num(r.pieces),
  }));
}

/** Numbers for the owner's overview. */
export async function storeNumbers(db: Db, storeId: number) {
  const [r] = await db.query<Record<string, number | string | null>>(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE store_id = ?) AS products,
       (SELECT COUNT(*) FROM products WHERE store_id = ? AND published = 1) AS published,
       (SELECT COUNT(*) FROM orders WHERE store_id = ? AND status IN ('awaiting_payment','paid')) AS open_orders,
       (SELECT COUNT(*) FROM orders WHERE store_id = ? AND status = 'paid') AS to_ship,
       (SELECT COALESCE(SUM(total_cents), 0) FROM orders
          WHERE store_id = ? AND status IN ('paid','shipped','delivered') AND created_at >= UTC_TIMESTAMP() - INTERVAL 30 DAY) AS sales_30d,
       (SELECT COUNT(*) FROM variants WHERE store_id = ? AND stock IS NOT NULL AND stock <= 0) AS sold_out`,
    [storeId, storeId, storeId, storeId, storeId, storeId],
  );
  return {
    products: num(r?.products),
    published: num(r?.published),
    openOrders: num(r?.open_orders),
    toShip: num(r?.to_ship),
    sales30dCents: num(r?.sales_30d),
    soldOut: num(r?.sold_out),
  };
}

/** The owner moves an order on (nextStatuses); cancelling gives the stock back once. */
export async function setOrderStatus(
  db: PluginDatabase,
  storeId: number,
  orderId: number,
  to: OrderStatus,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [r] = await tx.query<{ status: OrderStatus; payment_method: PaymentMethod }>(
      'SELECT status, payment_method FROM orders WHERE id = ? AND store_id = ? FOR UPDATE',
      [orderId, storeId],
    );
    if (!r) throw new HttpError(404, 'orderNotFound');
    if (!nextStatuses(r.status, r.payment_method).includes(to))
      throw new HttpError(409, 'statusMove');
    const stamp: Record<OrderStatus, string> = {
      awaiting_payment: '',
      paid: ', paid_at = COALESCE(paid_at, UTC_TIMESTAMP())',
      shipped: ', shipped_at = UTC_TIMESTAMP()',
      // Cash on delivery: the courier collected the money.
      delivered: ', delivered_at = UTC_TIMESTAMP(), paid_at = COALESCE(paid_at, UTC_TIMESTAMP())',
      cancelled: ', cancelled_at = UTC_TIMESTAMP()',
    };
    const stampSql = stamp[to];
    // sql-safe: stampSql — one of the fixed fragments above, picked by a checked status
    await tx.execute(`UPDATE orders SET status = ?${stampSql} WHERE id = ?`, [to, orderId]);
    if (to === 'cancelled') await restock(tx, orderId);
  });
}

/** A cancelled order gives its stock and its voucher use back. */
async function restock(tx: Db, orderId: number) {
  await tx.execute(
    `UPDATE variants v JOIN order_items i ON i.variant_id = v.id
     SET v.stock = v.stock + i.quantity
     WHERE i.order_id = ? AND v.stock IS NOT NULL`,
    [orderId],
  );
  await tx.execute(
    `UPDATE vouchers v JOIN orders o ON o.voucher_id = v.id
     SET v.uses = GREATEST(v.uses, 1) - 1 WHERE o.id = ?`,
    [orderId],
  );
}

export async function setTracking(
  db: Db,
  storeId: number,
  orderId: number,
  input: { carrier: CarrierCode | null; number: string | null; url: string | null },
): Promise<void> {
  const [found] = await db.query<{ id: number }>(
    'SELECT id FROM orders WHERE id = ? AND store_id = ?',
    [orderId, storeId],
  );
  if (!found) throw new HttpError(404, 'orderNotFound');
  await db.execute(
    'UPDATE orders SET carrier = ?, tracking_number = ?, tracking_url = ? WHERE id = ? AND store_id = ?',
    [input.carrier, input.number, input.url, orderId, storeId],
  );
}

/** The provider's id for this payment attempt (Stripe session, PayPal order). */
export async function setProviderRef(db: Db, orderId: number, ref: string): Promise<void> {
  await db.execute(
    "UPDATE orders SET provider_ref = ? WHERE id = ? AND status = 'awaiting_payment'",
    [ref, orderId],
  );
}

/**
 * A provider confirmed the payment: paid once, only for the expected attempt, amount and
 * currency. True when the order is (now or already) paid.
 */
export async function markPaidByProvider(
  db: Db,
  storeId: number,
  code: string,
  payment: { ref: string; amountCents: number; currency: string; method: 'stripe' | 'paypal' },
): Promise<boolean> {
  const res = await db.execute(
    `UPDATE orders SET status = 'paid', paid_at = UTC_TIMESTAMP()
     WHERE store_id = ? AND code = ? AND status = 'awaiting_payment' AND payment_method = ?
       AND provider_ref = ? AND total_cents = ? AND currency = ?`,
    [storeId, code, payment.method, payment.ref, payment.amountCents, payment.currency],
  );
  if (res.affectedRows > 0) return true;
  const [r] = await db.query<{ status: OrderStatus }>(
    'SELECT status FROM orders WHERE store_id = ? AND code = ?',
    [storeId, code],
  );
  return r !== undefined && r.status !== 'awaiting_payment' && r.status !== 'cancelled';
}

// ---------------------------------------------------------------------------------------------
// Background work (platform.ts → scheduled)

/** Card and PayPal orders never paid within a day: cancelled and their stock given back. */
// sql-safe: limit — a whole number from the caller, never from a request
export async function expireUnpaid(db: PluginDatabase, now: Date, limit = 50): Promise<number> {
  const cutoff = new Date(now.getTime() - 24 * 3600_000);
  const rows = await db.query<{ id: number }>(
    `SELECT id FROM orders WHERE status = 'awaiting_payment' AND payment_method IN ('stripe','paypal')
       AND created_at < ? ORDER BY id LIMIT ${limit}`,
    [cutoff],
  );
  for (const r of rows) {
    await db.transaction(async (tx) => {
      const res = await tx.execute(
        `UPDATE orders SET status = 'cancelled', cancelled_at = UTC_TIMESTAMP(),
           owner_notified_at = COALESCE(owner_notified_at, UTC_TIMESTAMP())
         WHERE id = ? AND status = 'awaiting_payment'`,
        [r.id],
      );
      if (res.affectedRows > 0) await restock(tx, num(r.id));
    });
  }
  return rows.length;
}

/** Orders the owner has not been told about: card and PayPal ones once paid, the others at once. */
// sql-safe: limit — a whole number from the caller, never from a request
export async function ordersToAnnounce(db: Db, limit = 20) {
  const rows = await db.query<{ id: number; store_id: number; owner_user_id: number }>(
    `SELECT o.id, o.store_id, s.owner_user_id FROM orders o JOIN stores s ON s.id = o.store_id
     WHERE o.owner_notified_at IS NULL
       AND (o.status <> 'awaiting_payment' OR o.payment_method IN ('bank','cod'))
     ORDER BY o.id LIMIT ${limit}`,
  );
  return rows.map((r) => ({
    id: num(r.id),
    storeId: num(r.store_id),
    ownerUserId: num(r.owner_user_id),
  }));
}

export async function markAnnounced(db: Db, orderId: number): Promise<void> {
  await db.execute('UPDATE orders SET owner_notified_at = UTC_TIMESTAMP() WHERE id = ?', [orderId]);
}

// ---------------------------------------------------------------------------------------------
// Platform hooks

/**
 * Deletes the user's store with everything in it (products, photos, zones, orders, reviews,
 * marketing, buyers' accounts and messages, subscribers, statistics), their place on another
 * shop's team and the invitations they made.
 */
export async function deleteStoreOf(db: Db, userId: number): Promise<void> {
  await db.execute('DELETE FROM stores WHERE owner_user_id = ?', [userId]);
  await db.execute('DELETE FROM store_staff WHERE user_id = ?', [userId]);
  await db.execute('DELETE FROM store_invites WHERE created_by = ?', [userId]);
}

export async function totals(db: Db) {
  const [r] = await db.query<Record<string, number | string>>(
    `SELECT (SELECT COUNT(*) FROM stores) AS stores,
            (SELECT COUNT(*) FROM stores WHERE published = 1) AS published,
            (SELECT COUNT(*) FROM products) AS products,
            (SELECT COUNT(*) FROM orders) AS orders,
            (SELECT COUNT(*) FROM buyers) AS buyers,
            (SELECT COUNT(*) FROM subscribers WHERE status = 'confirmed') AS subscribers,
            (SELECT COUNT(*) FROM reviews) AS reviews`,
  );
  return {
    stores: num(r?.stores),
    published: num(r?.published),
    products: num(r?.products),
    orders: num(r?.orders),
    buyers: num(r?.buyers),
    subscribers: num(r?.subscribers),
    reviews: num(r?.reviews),
  };
}
