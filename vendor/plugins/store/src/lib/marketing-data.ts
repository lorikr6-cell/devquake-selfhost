import type { PluginDatabase } from '@devquake/plugin-sdk';
import { HttpError } from './http';
import {
  isLive,
  type AnnouncementPlacement,
  type AnnouncementTone,
  type CampaignScope,
  type VoucherKind,
  type VoucherRule,
} from './marketing';
import { publicRules, type PriceRule, type PublicRule, type RuleKind } from './rules';

// Campaigns, vouchers and announcements (ADR 0058). SQL with ? placeholders only; every query
// names the store.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);
const nullableNum = (v: unknown) => (v === null || v === undefined ? null : num(v));

export const MARKETING_LIMITS = {
  campaigns: 100,
  vouchers: 500,
  announcements: 50,
  campaignProducts: 500,
  name: 80,
  description: 300,
  voucherDescription: 160,
  message: 200,
  details: 500,
  linkLabel: 40,
} as const;

async function count(db: Db, table: 'campaigns' | 'vouchers' | 'announcements', storeId: number) {
  const [r] = await db.query<{ n: number }>(
    // sql-safe: table — one of three fixed table names from the type above
    `SELECT COUNT(*) AS n FROM ${table} WHERE store_id = ?`,
    [storeId],
  );
  return num(r?.n);
}

async function mustExist(
  db: Db,
  table: 'campaigns' | 'vouchers' | 'announcements',
  id: number,
  storeId: number,
) {
  const [r] = await db.query<{ id: number }>(
    // sql-safe: table — one of three fixed table names from the type above
    `SELECT id FROM ${table} WHERE id = ? AND store_id = ?`,
    [id, storeId],
  );
  if (!r) throw new HttpError(404, 'notFound');
}

// ---------------------------------------------------------------------------------------------
// Campaigns

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  percentOff: number;
  scope: CampaignScope;
  category: string | null;
  productIds: number[];
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

export type CampaignInput = Omit<Campaign, 'id' | 'startsAt' | 'endsAt'> & {
  startsAt: Date | null;
  endsAt: Date | null;
};

export async function listCampaigns(db: Db, storeId: number): Promise<Campaign[]> {
  const rows = await db.query<Record<string, unknown>>(
    'SELECT * FROM campaigns WHERE store_id = ? ORDER BY active DESC, COALESCE(starts_at, created_at) DESC LIMIT 200',
    [storeId],
  );
  const picked = await db.query<{ campaign_id: number; product_id: number }>(
    `SELECT cp.campaign_id, cp.product_id FROM campaign_products cp
     JOIN campaigns c ON c.id = cp.campaign_id WHERE c.store_id = ?`,
    [storeId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    name: String(r.name),
    description: (r.description as string | null) ?? null,
    percentOff: num(r.percent_off),
    scope: r.scope as CampaignScope,
    category: (r.category as string | null) ?? null,
    productIds: picked
      .filter((p) => num(p.campaign_id) === num(r.id))
      .map((p) => num(p.product_id)),
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    active: Boolean(r.active),
  }));
}

async function writeCampaignProducts(tx: Db, storeId: number, campaignId: number, ids: number[]) {
  await tx.execute('DELETE FROM campaign_products WHERE campaign_id = ?', [campaignId]);
  for (const productId of ids) {
    // Only the store's own products.
    await tx.execute(
      `INSERT IGNORE INTO campaign_products (campaign_id, product_id)
       SELECT ?, id FROM products WHERE id = ? AND store_id = ?`,
      [campaignId, productId, storeId],
    );
  }
}

const campaignValues = (c: CampaignInput) => [
  c.name,
  c.description,
  c.percentOff,
  c.scope,
  c.scope === 'category' ? c.category : null,
  c.startsAt,
  c.endsAt,
  c.active ? 1 : 0,
];

export async function createCampaign(
  db: PluginDatabase,
  storeId: number,
  input: CampaignInput,
): Promise<number> {
  if ((await count(db, 'campaigns', storeId)) >= MARKETING_LIMITS.campaigns)
    throw new HttpError(409, 'tooMany');
  return db.transaction(async (tx) => {
    const res = await tx.execute(
      `INSERT INTO campaigns (name, description, percent_off, scope, category, starts_at, ends_at, active, store_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...campaignValues(input), storeId],
    );
    if (input.scope === 'products')
      await writeCampaignProducts(tx, storeId, res.insertId, input.productIds);
    return res.insertId;
  });
}

export async function updateCampaign(
  db: PluginDatabase,
  storeId: number,
  id: number,
  input: CampaignInput,
): Promise<void> {
  await mustExist(db, 'campaigns', id, storeId);
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE campaigns SET name = ?, description = ?, percent_off = ?, scope = ?, category = ?, starts_at = ?, ends_at = ?, active = ?
       WHERE id = ? AND store_id = ?`,
      [...campaignValues(input), id, storeId],
    );
    await writeCampaignProducts(
      tx,
      storeId,
      id,
      input.scope === 'products' ? input.productIds : [],
    );
  });
}

export async function deleteCampaign(db: Db, storeId: number, id: number): Promise<void> {
  const res = await db.execute('DELETE FROM campaigns WHERE id = ? AND store_id = ?', [
    id,
    storeId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}

// ---------------------------------------------------------------------------------------------
// Vouchers

export type Voucher = VoucherRule;

export type VoucherInput = Omit<Voucher, 'id' | 'uses' | 'startsAt' | 'endsAt'> & {
  startsAt: Date | null;
  endsAt: Date | null;
};

const toVoucher = (r: Record<string, unknown>): Voucher => ({
  id: num(r.id),
  code: String(r.code),
  description: (r.description as string | null) ?? null,
  kind: r.kind as VoucherKind,
  percentOff: nullableNum(r.percent_off),
  amountCents: nullableNum(r.amount_cents),
  minOrderCents: nullableNum(r.min_order_cents),
  startsAt: iso(r.starts_at),
  endsAt: iso(r.ends_at),
  maxUses: nullableNum(r.max_uses),
  uses: num(r.uses),
  oncePerBuyer: Boolean(r.once_per_buyer),
  active: Boolean(r.active),
});

export async function listVouchers(db: Db, storeId: number): Promise<Voucher[]> {
  const rows = await db.query<Record<string, unknown>>(
    'SELECT * FROM vouchers WHERE store_id = ? ORDER BY active DESC, created_at DESC LIMIT 500',
    [storeId],
  );
  return rows.map(toVoucher);
}

export async function voucherByCode(
  db: Db,
  storeId: number,
  code: string,
): Promise<Voucher | null> {
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM vouchers WHERE store_id = ? AND code = ?',
    [storeId, code],
  );
  return r ? toVoucher(r) : null;
}

export async function voucherById(db: Db, storeId: number, id: number): Promise<Voucher | null> {
  const [r] = await db.query<Record<string, unknown>>(
    'SELECT * FROM vouchers WHERE store_id = ? AND id = ?',
    [storeId, id],
  );
  return r ? toVoucher(r) : null;
}

const voucherValues = (v: VoucherInput) => [
  v.code,
  v.description,
  v.kind,
  v.kind === 'percent' ? v.percentOff : null,
  v.kind === 'amount' ? v.amountCents : null,
  v.minOrderCents,
  v.startsAt,
  v.endsAt,
  v.maxUses,
  v.oncePerBuyer ? 1 : 0,
  v.active ? 1 : 0,
];

async function codeTaken(db: Db, storeId: number, code: string, exceptId: number | null) {
  const existing = await voucherByCode(db, storeId, code);
  return existing !== null && existing.id !== exceptId;
}

export async function createVoucher(db: Db, storeId: number, input: VoucherInput): Promise<number> {
  if ((await count(db, 'vouchers', storeId)) >= MARKETING_LIMITS.vouchers)
    throw new HttpError(409, 'tooMany');
  if (await codeTaken(db, storeId, input.code, null)) throw new HttpError(409, 'voucherTaken');
  const res = await db.execute(
    `INSERT INTO vouchers (code, description, kind, percent_off, amount_cents, min_order_cents, starts_at, ends_at, max_uses, once_per_buyer, active, store_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...voucherValues(input), storeId],
  );
  return res.insertId;
}

export async function updateVoucher(
  db: Db,
  storeId: number,
  id: number,
  input: VoucherInput,
): Promise<void> {
  await mustExist(db, 'vouchers', id, storeId);
  if (await codeTaken(db, storeId, input.code, id)) throw new HttpError(409, 'voucherTaken');
  await db.execute(
    `UPDATE vouchers SET code = ?, description = ?, kind = ?, percent_off = ?, amount_cents = ?, min_order_cents = ?,
       starts_at = ?, ends_at = ?, max_uses = ?, once_per_buyer = ?, active = ?
     WHERE id = ? AND store_id = ?`,
    [...voucherValues(input), id, storeId],
  );
}

/** Orders keep the code they used; the voucher itself goes. */
export async function deleteVoucher(db: Db, storeId: number, id: number): Promise<void> {
  const res = await db.execute('DELETE FROM vouchers WHERE id = ? AND store_id = ?', [id, storeId]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}

// ---------------------------------------------------------------------------------------------
// Announcements

export interface Announcement {
  id: number;
  message: string;
  details: string | null;
  tone: AnnouncementTone;
  placement: AnnouncementPlacement;
  linkUrl: string | null;
  linkLabel: string | null;
  voucherId: number | null;
  /** The voucher's code, for the shop to show (only while the voucher is live). */
  voucherCode: string | null;
  campaignId: number | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

export type AnnouncementInput = Omit<Announcement, 'id' | 'voucherCode' | 'startsAt' | 'endsAt'> & {
  startsAt: Date | null;
  endsAt: Date | null;
};

export async function listAnnouncements(db: Db, storeId: number): Promise<Announcement[]> {
  const rows = await db.query<Record<string, unknown>>(
    `SELECT a.*, v.code AS voucher_code, v.active AS v_active, v.starts_at AS v_starts, v.ends_at AS v_ends
     FROM announcements a LEFT JOIN vouchers v ON v.id = a.voucher_id
     WHERE a.store_id = ? ORDER BY a.active DESC, a.created_at DESC LIMIT 100`,
    [storeId],
  );
  const now = new Date();
  return rows.map((r) => {
    const voucherLive =
      r.voucher_code !== null &&
      r.voucher_code !== undefined &&
      isLive(
        { active: Boolean(r.v_active), startsAt: iso(r.v_starts), endsAt: iso(r.v_ends) },
        now,
      );
    return {
      id: num(r.id),
      message: String(r.message),
      details: (r.details as string | null) ?? null,
      tone: r.tone as AnnouncementTone,
      placement: r.placement as AnnouncementPlacement,
      linkUrl: (r.link_url as string | null) ?? null,
      linkLabel: (r.link_label as string | null) ?? null,
      voucherId: nullableNum(r.voucher_id),
      voucherCode: voucherLive ? String(r.voucher_code) : null,
      campaignId: nullableNum(r.campaign_id),
      startsAt: iso(r.starts_at),
      endsAt: iso(r.ends_at),
      active: Boolean(r.active),
    };
  });
}

/** What the shop shows now. */
export async function liveAnnouncements(db: Db, storeId: number, now: Date) {
  return (await listAnnouncements(db, storeId)).filter((a) => isLive(a, now));
}

async function checkLinks(db: Db, storeId: number, input: AnnouncementInput) {
  if (input.voucherId !== null && !(await voucherById(db, storeId, input.voucherId)))
    throw new HttpError(400, 'invalidRequest');
  if (input.campaignId !== null) await mustExist(db, 'campaigns', input.campaignId, storeId);
}

const announcementValues = (a: AnnouncementInput) => [
  a.message,
  a.details,
  a.tone,
  a.placement,
  a.linkUrl,
  a.linkUrl ? a.linkLabel : null,
  a.voucherId,
  a.campaignId,
  a.startsAt,
  a.endsAt,
  a.active ? 1 : 0,
];

export async function createAnnouncement(
  db: Db,
  storeId: number,
  input: AnnouncementInput,
): Promise<number> {
  if ((await count(db, 'announcements', storeId)) >= MARKETING_LIMITS.announcements)
    throw new HttpError(409, 'tooMany');
  await checkLinks(db, storeId, input);
  const res = await db.execute(
    `INSERT INTO announcements (message, details, tone, placement, link_url, link_label, voucher_id, campaign_id, starts_at, ends_at, active, store_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [...announcementValues(input), storeId],
  );
  return res.insertId;
}

export async function updateAnnouncement(
  db: Db,
  storeId: number,
  id: number,
  input: AnnouncementInput,
): Promise<void> {
  await mustExist(db, 'announcements', id, storeId);
  await checkLinks(db, storeId, input);
  await db.execute(
    `UPDATE announcements SET message = ?, details = ?, tone = ?, placement = ?, link_url = ?, link_label = ?,
       voucher_id = ?, campaign_id = ?, starts_at = ?, ends_at = ?, active = ?
     WHERE id = ? AND store_id = ?`,
    [...announcementValues(input), id, storeId],
  );
}

export async function deleteAnnouncement(db: Db, storeId: number, id: number): Promise<void> {
  const res = await db.execute('DELETE FROM announcements WHERE id = ? AND store_id = ?', [
    id,
    storeId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}

// ---------------------------------------------------------------------------------------------
// Automatic discounts and free shipping

export type Rule = PriceRule;

export type RuleInput = Omit<Rule, 'id' | 'startsAt' | 'endsAt'> & {
  startsAt: Date | null;
  endsAt: Date | null;
};

const toRule = (r: Record<string, unknown>): Rule => ({
  id: num(r.id),
  kind: r.kind as RuleKind,
  threshold: num(r.threshold),
  percentOff: nullableNum(r.percent_off),
  startsAt: iso(r.starts_at),
  endsAt: iso(r.ends_at),
  active: Boolean(r.active),
});

export async function listRules(db: Db, storeId: number): Promise<Rule[]> {
  const rows = await db.query<Record<string, unknown>>(
    'SELECT * FROM price_rules WHERE store_id = ? ORDER BY kind, threshold LIMIT 100',
    [storeId],
  );
  return rows.map(toRule);
}

/** The rules buyers get now (live only, without dates). */
export async function liveRules(db: Db, storeId: number, now: Date): Promise<PublicRule[]> {
  return publicRules(await listRules(db, storeId), now);
}

const ruleValues = (r: RuleInput) => [
  r.kind,
  r.threshold,
  r.kind === 'free_shipping' ? null : r.percentOff,
  r.startsAt,
  r.endsAt,
  r.active ? 1 : 0,
];

export async function createRule(db: Db, storeId: number, input: RuleInput): Promise<number> {
  const [r] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM price_rules WHERE store_id = ?',
    [storeId],
  );
  if (num(r?.n) >= 50) throw new HttpError(409, 'tooMany');
  const res = await db.execute(
    `INSERT INTO price_rules (kind, threshold, percent_off, starts_at, ends_at, active, store_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [...ruleValues(input), storeId],
  );
  return res.insertId;
}

export async function updateRule(db: Db, storeId: number, id: number, input: RuleInput) {
  const [found] = await db.query<{ id: number }>(
    'SELECT id FROM price_rules WHERE id = ? AND store_id = ?',
    [id, storeId],
  );
  if (!found) throw new HttpError(404, 'notFound');
  await db.execute(
    `UPDATE price_rules SET kind = ?, threshold = ?, percent_off = ?, starts_at = ?, ends_at = ?, active = ?
     WHERE id = ? AND store_id = ?`,
    [...ruleValues(input), id, storeId],
  );
}

export async function deleteRule(db: Db, storeId: number, id: number): Promise<void> {
  const res = await db.execute('DELETE FROM price_rules WHERE id = ? AND store_id = ?', [
    id,
    storeId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}
