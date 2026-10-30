import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { ItemInput, Station, StaffRole, TipMode, TipSettings, VenueInput } from './model';
import { hashPin, newTabletToken, tokenHash } from './secure';

// The venue database (migration 0001). Every function takes the venue's id from the caller,
// who found it by its owner (venueOfOwner): nothing reaches another venue's rows.

type Db = Omit<PluginDatabase, 'transaction'>;

export interface Venue {
  id: number;
  ownerUserId: number;
  slug: string;
  name: string;
  country: string;
  currency: string;
  vatRates: number[];
  decimals: number;
  menuPublic: boolean;
  tips: TipSettings;
}

interface VenueRow {
  id: number;
  owner_user_id: number;
  slug: string;
  name: string;
  country: string;
  currency: string;
  vat_rates: string;
  decimals: number;
  menu_public: number;
  tip_mode: TipMode;
  tip_percents: string;
  tip_fixed_minor: number | string;
}

const toVenue = (r: VenueRow): Venue => ({
  id: r.id,
  ownerUserId: r.owner_user_id,
  slug: r.slug,
  name: r.name,
  country: r.country,
  currency: r.currency,
  vatRates: r.vat_rates.split(',').map(Number).filter(Number.isFinite),
  decimals: Number(r.decimals),
  menuPublic: r.menu_public === 1,
  tips: {
    tipMode: r.tip_mode,
    tipPercents: r.tip_percents.split(',').map(Number).filter(Number.isFinite),
    tipFixedMinor: Number(r.tip_fixed_minor),
  },
});

const VENUE_COLS = `id, owner_user_id, slug, name, country, currency, vat_rates, decimals, menu_public,
  tip_mode, tip_percents, tip_fixed_minor`;

export async function venueOfOwner(db: Db, userId: number): Promise<Venue | null> {
  const [r] = await db.query<VenueRow>(`SELECT ${VENUE_COLS} FROM venues WHERE owner_user_id = ?`, [
    userId,
  ]);
  return r ? toVenue(r) : null;
}

export async function venueBySlug(db: Db, slug: string): Promise<Venue | null> {
  const [r] = await db.query<VenueRow>(`SELECT ${VENUE_COLS} FROM venues WHERE slug = ?`, [slug]);
  return r ? toVenue(r) : null;
}

/** The address part of the public menu, made from the name (a number added when taken). */
function slugFrom(name: string): string {
  const s = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return s.length >= 2 ? s : 'venue';
}

export async function createVenue(db: Db, userId: number, v: VenueInput): Promise<Venue> {
  const base = slugFrom(v.name);
  const taken = new Set(
    (
      await db.query<{ slug: string }>('SELECT slug FROM venues WHERE slug LIKE ?', [`${base}%`])
    ).map((r) => r.slug),
  );
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
  await db.execute(
    `INSERT INTO venues (owner_user_id, slug, name, country, currency, vat_rates, decimals)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, slug, v.name, v.country, v.currency, v.vatRates.join(','), v.decimals],
  );
  return (await venueOfOwner(db, userId))!;
}

export async function updateVenue(db: Db, venueId: number, v: VenueInput, menuPublic: boolean) {
  await db.execute(
    `UPDATE venues SET name = ?, country = ?, currency = ?, vat_rates = ?, decimals = ?,
            menu_public = ? WHERE id = ?`,
    [v.name, v.country, v.currency, v.vatRates.join(','), v.decimals, menuPublic ? 1 : 0, venueId],
  );
}

/** Tips on the bill: off, percentages before VAT, or a fixed tip. */
export async function updateTips(db: Db, venueId: number, tips: TipSettings) {
  await db.execute(
    'UPDATE venues SET tip_mode = ?, tip_percents = ?, tip_fixed_minor = ? WHERE id = ?',
    [tips.tipMode, tips.tipPercents.join(','), tips.tipFixedMinor, venueId],
  );
}

// --- staff and tablets (ADR 0080) ------------------------------------------------------------

export interface StaffMember {
  id: number;
  name: string;
  role: StaffRole;
  hasPin: boolean;
}

export async function listStaff(db: Db, venueId: number): Promise<StaffMember[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    role: StaffRole;
    pin_hash: string | null;
  }>('SELECT id, name, role, pin_hash FROM staff WHERE venue_id = ? AND active = 1 ORDER BY name', [
    venueId,
  ]);
  return rows.map((r) => ({ id: r.id, name: r.name, role: r.role, hasPin: !!r.pin_hash }));
}

export async function addStaff(
  db: Db,
  venueId: number,
  name: string,
  role: StaffRole,
  pin: string,
) {
  await db.execute('INSERT INTO staff (venue_id, name, role, pin_hash) VALUES (?, ?, ?, ?)', [
    venueId,
    name,
    role,
    hashPin(pin),
  ]);
}

export async function setStaffPin(db: Db, venueId: number, staffId: number, pin: string) {
  const r = await db.execute('UPDATE staff SET pin_hash = ? WHERE id = ? AND venue_id = ?', [
    hashPin(pin),
    staffId,
    venueId,
  ]);
  return r.affectedRows === 1;
}

/** Staff leave the list but stay on past orders under their name. */
export async function removeStaff(db: Db, venueId: number, staffId: number) {
  const r = await db.execute('UPDATE staff SET active = 0 WHERE id = ? AND venue_id = ?', [
    staffId,
    venueId,
  ]);
  return r.affectedRows === 1;
}

export interface Tablet {
  id: number;
  name: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export async function listTablets(db: Db, venueId: number): Promise<Tablet[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    last_used_at: Date | null;
    created_at: Date;
  }>(
    'SELECT id, name, last_used_at, created_at FROM tablets WHERE venue_id = ? AND revoked_at IS NULL ORDER BY created_at',
    [venueId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    lastUsedAt: r.last_used_at,
    createdAt: r.created_at,
  }));
}

/** Enables a tablet: returns the token for its cookie (only its hash is kept). */
export async function addTablet(
  db: Db,
  venueId: number,
  name: string,
  userId: number,
): Promise<string> {
  const token = newTabletToken();
  await db.execute(
    'INSERT INTO tablets (venue_id, name, token_hash, created_by) VALUES (?, ?, ?, ?)',
    [venueId, name, tokenHash(token), userId],
  );
  return token;
}

export async function revokeTablet(db: Db, venueId: number, tabletId: number) {
  const r = await db.execute(
    'UPDATE tablets SET revoked_at = UTC_TIMESTAMP() WHERE id = ? AND venue_id = ? AND revoked_at IS NULL',
    [tabletId, venueId],
  );
  return r.affectedRows === 1;
}

/** The venue an enabled tablet belongs to (stage 2's tablet routes use it). */
export async function tabletVenue(
  db: Db,
  token: string,
): Promise<{ tabletId: number; venueId: number } | null> {
  const [r] = await db.query<{ id: number; venue_id: number }>(
    'SELECT id, venue_id FROM tablets WHERE token_hash = ? AND revoked_at IS NULL',
    [tokenHash(token)],
  );
  if (!r) return null;
  await db.execute('UPDATE tablets SET last_used_at = UTC_TIMESTAMP() WHERE id = ?', [r.id]);
  return { tabletId: r.id, venueId: r.venue_id };
}

// --- the menu --------------------------------------------------------------------------------

export interface Category {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  priceMinor: number;
  vatRate: number;
  station: Station;
  allergens: number;
  available: boolean;
}

export async function menuOf(
  db: Db,
  venueId: number,
): Promise<{ categories: Category[]; items: Item[] }> {
  const [categories, items] = await Promise.all([
    db.query<{ id: number; name: string }>(
      'SELECT id, name FROM menu_categories WHERE venue_id = ? ORDER BY sort_order, id',
      [venueId],
    ),
    db.query<{
      id: number;
      category_id: number;
      name: string;
      description: string | null;
      price_minor: number | string;
      vat_rate: number;
      station: Station;
      allergens: number;
      available: number;
    }>(
      `SELECT id, category_id, name, description, price_minor, vat_rate, station, allergens, available
         FROM menu_items WHERE venue_id = ? ORDER BY sort_order, id`,
      [venueId],
    ),
  ]);
  return {
    categories,
    items: items.map((r) => ({
      id: r.id,
      categoryId: r.category_id,
      name: r.name,
      description: r.description,
      priceMinor: Number(r.price_minor),
      vatRate: Number(r.vat_rate),
      station: r.station,
      allergens: Number(r.allergens),
      available: r.available === 1,
    })),
  };
}

export async function addCategory(db: Db, venueId: number, name: string) {
  const [c] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM menu_categories WHERE venue_id = ?',
    [venueId],
  );
  const r = await db.execute(
    'INSERT INTO menu_categories (venue_id, name, sort_order) VALUES (?, ?, ?)',
    [venueId, name, Number(c?.n ?? 0)],
  );
  return r.insertId;
}

export async function renameCategory(db: Db, venueId: number, id: number, name: string) {
  const r = await db.execute('UPDATE menu_categories SET name = ? WHERE id = ? AND venue_id = ?', [
    name,
    id,
    venueId,
  ]);
  return r.affectedRows === 1;
}

export async function removeCategory(db: Db, venueId: number, id: number) {
  const r = await db.execute('DELETE FROM menu_categories WHERE id = ? AND venue_id = ?', [
    id,
    venueId,
  ]);
  return r.affectedRows === 1;
}

async function ownsCategory(db: Db, venueId: number, categoryId: number) {
  const [c] = await db.query<{ id: number }>(
    'SELECT id FROM menu_categories WHERE id = ? AND venue_id = ?',
    [categoryId, venueId],
  );
  return !!c;
}

export async function addItem(db: Db, venueId: number, i: ItemInput): Promise<number | null> {
  if (!(await ownsCategory(db, venueId, i.categoryId))) return null;
  const r = await db.execute(
    `INSERT INTO menu_items (venue_id, category_id, name, description, price_minor, vat_rate,
                             station, allergens, available)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      venueId,
      i.categoryId,
      i.name,
      i.description,
      i.priceMinor,
      i.vatRate,
      i.station,
      i.allergens,
      i.available ? 1 : 0,
    ],
  );
  return r.insertId;
}

export async function updateItem(
  db: Db,
  venueId: number,
  id: number,
  i: ItemInput,
): Promise<boolean> {
  if (!(await ownsCategory(db, venueId, i.categoryId))) return false;
  const r = await db.execute(
    `UPDATE menu_items SET category_id = ?, name = ?, description = ?, price_minor = ?, vat_rate = ?,
            station = ?, allergens = ?, available = ? WHERE id = ? AND venue_id = ?`,
    [
      i.categoryId,
      i.name,
      i.description,
      i.priceMinor,
      i.vatRate,
      i.station,
      i.allergens,
      i.available ? 1 : 0,
      id,
      venueId,
    ],
  );
  return r.affectedRows === 1;
}

export async function removeItem(db: Db, venueId: number, id: number) {
  const r = await db.execute('DELETE FROM menu_items WHERE id = ? AND venue_id = ?', [id, venueId]);
  return r.affectedRows === 1;
}

/** Everything of a member's venue (account deletion, unsubscribing). */
export async function deleteVenueOf(db: Db, userId: number) {
  await db.execute('DELETE FROM venues WHERE owner_user_id = ?', [userId]);
}

export async function totals(db: Db) {
  const [r] = await db.query<{ venues: number; items: number }>(
    'SELECT (SELECT COUNT(*) FROM venues) AS venues, (SELECT COUNT(*) FROM menu_items) AS items',
  );
  return { venues: Number(r?.venues ?? 0), items: Number(r?.items ?? 0) };
}
