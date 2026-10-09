import { randomInt } from 'node:crypto';
import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { HttpError } from './http';
import { newInviteCode, type Item, type ListSnapshot, type Member, type Store } from './model';
import { photoUrl } from './photos';
import { logoKey } from './logo-finder';
import { ensureLogo, logoState } from './logos';
import type { ActivityEvent } from './events';
import type { StatsInput } from './stats';
import type { SuggestionRow } from './suggestions';
import type { PriceObservation } from './prices';

/**
 * Data access for the shopping plugin, on its OWN database (ctx.db, ADR 0007). Every function
 * that touches a list first checks that the user is a member of it.
 */

export { HttpError };

type Db = Omit<PluginDatabase, 'transaction'>;

interface ListRow {
  id: number;
  name: string;
  currency: string;
  shop_date: string;
  version: number;
  role: 'owner' | 'member';
}

/** Dates always leave the database as "YYYY-MM-DD" text (no timezone shifts). */
const SHOP_DATE = "DATE_FORMAT(l.shop_date, '%Y-%m-%d') AS shop_date";

export async function membership(db: Db, listId: number, userId: number) {
  const [row] = await db.query<ListRow>(
    `SELECT l.id, l.name, l.currency, ${SHOP_DATE}, l.version, m.role
       FROM lists l JOIN list_members m ON m.list_id = l.id
      WHERE l.id = ? AND m.user_id = ?`,
    [listId, userId],
  );
  return row ?? null;
}

export async function requireMember(db: Db, listId: number, userId: number) {
  const row = await membership(db, listId, userId);
  if (!row) throw new HttpError(404, 'listNotFound');
  return row;
}

export async function requireOwner(db: Db, listId: number, userId: number) {
  const row = await requireMember(db, listId, userId);
  if (row.role !== 'owner') throw new HttpError(403, 'ownerOnly');
  return row;
}

/** Marks a list as changed so every open copy refreshes. */
export async function touch(db: Db, listId: number) {
  await db.execute('UPDATE lists SET version = version + 1 WHERE id = ?', [listId]);
}

/** Keeps the member's display name in sync with their DevQuake profile. */
export async function refreshMemberName(db: Db, listId: number, user: PluginUser) {
  await db.execute(
    'UPDATE list_members SET display_name = ? WHERE list_id = ? AND user_id = ? AND display_name <> ?',
    [user.displayName, listId, user.id, user.displayName],
  );
}

export interface ListSummary {
  id: number;
  name: string;
  currency: string;
  /** "YYYY-MM-DD" */
  shopDate: string;
  role: 'owner' | 'member';
  members: number;
  open: number;
  done: number;
  /** Sum of priced lines (price x quantity, 1 without a quantity). */
  total: number;
}

/** Every list the user is on, newest shopping date first. */
export async function listsForUser(db: Db, userId: number): Promise<ListSummary[]> {
  const rows = await db.query<{
    id: number;
    name: string;
    currency: string;
    shop_date: string;
    role: 'owner' | 'member';
    members: number | string;
    open: number | string | null;
    done: number | string | null;
    total: number | string | null;
  }>(
    `SELECT l.id, l.name, l.currency, ${SHOP_DATE}, m.role,
            (SELECT COUNT(*) FROM list_members x WHERE x.list_id = l.id) AS members,
            (SELECT COUNT(*) FROM items i
              WHERE i.list_id = l.id AND i.done_at IS NULL AND i.dropped_at IS NULL) AS open,
            (SELECT COUNT(*) FROM items i WHERE i.list_id = l.id AND i.done_at IS NOT NULL) AS done,
            (SELECT SUM(i.price * COALESCE(i.quantity, 1)) FROM items i
              WHERE i.list_id = l.id AND (i.done_at IS NOT NULL OR i.dropped_at IS NULL)) AS total
       FROM lists l JOIN list_members m ON m.list_id = l.id
      WHERE m.user_id = ?
      ORDER BY l.shop_date DESC, l.updated_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    currency: r.currency,
    shopDate: r.shop_date,
    role: r.role,
    members: Number(r.members),
    open: Number(r.open ?? 0),
    done: Number(r.done ?? 0),
    total: Math.round(Number(r.total ?? 0) * 100) / 100,
  }));
}

interface ItemRow {
  id: number;
  list_id: number;
  store_id: number | null;
  name: string;
  quantity: string | number | null;
  unit: string | null;
  price: string | number | null;
  estimated_price: string | number | null;
  price_corrected_by_name: string | null;
  description: string | null;
  added_by_name: string | null;
  done_at: Date | null;
  done_by_name: string | null;
  dropped_at: Date | null;
  dropped_by_name: string | null;
  /** Photo version (upload time), null without a photo. */
  photo_v: number | string | null;
}

/** Item columns (alias i) plus the photo version from item_photos (alias p). */
const ITEM_COLUMNS = `i.id, i.list_id, i.store_id, i.name, i.quantity, i.unit, i.price,
  i.estimated_price, i.price_corrected_by_name, i.description,
  i.added_by_name, i.done_at, i.done_by_name, i.dropped_at, i.dropped_by_name,
  UNIX_TIMESTAMP(p.updated_at) AS photo_v`;

function toItem(r: ItemRow): Item {
  return {
    id: r.id,
    storeId: r.store_id,
    name: r.name,
    quantity: r.quantity === null ? null : Number(r.quantity),
    unit: r.unit,
    price: r.price === null ? null : Number(r.price),
    estimatedPrice: r.estimated_price === null ? null : Number(r.estimated_price),
    priceCorrectedByName: r.price_corrected_by_name,
    description: r.description,
    addedByName: r.added_by_name,
    done: r.done_at !== null,
    doneByName: r.done_by_name,
    dropped: r.dropped_at !== null,
    droppedByName: r.dropped_by_name,
    photo: r.photo_v === null ? null : photoUrl(r.list_id, r.id, Number(r.photo_v)),
  };
}

export async function snapshot(db: Db, listId: number, userId: number): Promise<ListSnapshot> {
  const list = await requireMember(db, listId, userId);
  const [members, stores, items] = await Promise.all([
    db.query<{ user_id: number; display_name: string; role: Member['role'] }>(
      `SELECT user_id, display_name, role FROM list_members WHERE list_id = ?
        ORDER BY role = 'owner' DESC, joined_at`,
      [listId],
    ),
    db.query<Store>(
      'SELECT id, name, type, location, description FROM stores WHERE list_id = ? ORDER BY name, id',
      [listId],
    ),
    db.query<ItemRow>(
      `SELECT ${ITEM_COLUMNS}
         FROM items i LEFT JOIN item_photos p ON p.item_id = i.id
        WHERE i.list_id = ? ORDER BY i.position, i.id`,
      [listId],
    ),
  ]);
  return {
    id: list.id,
    name: list.name,
    currency: list.currency,
    shopDate: list.shop_date,
    version: Number(list.version),
    role: list.role,
    members: members.map((m) => ({ userId: m.user_id, displayName: m.display_name, role: m.role })),
    stores: await withLogos(db, listId, stores),
    items: items.map(toItem),
  };
}

/**
 * The stores with their logos (ADR 0052). Stores whose name was never looked up (added before
 * logos, or while the lookup was busy) are looked up now, in the background.
 */
async function withLogos(db: Db, listId: number, stores: Store[]): Promise<Store[]> {
  const { found, unknown } = await logoState(
    db,
    stores.map((s) => s.name),
  );
  for (const s of stores) {
    if (unknown.has(logoKey(s.name))) ensureLogo(db, { name: s.name }, () => touch(db, listId));
  }
  return stores.map((s) => ({ ...s, logo: found.get(logoKey(s.name)) ?? null }));
}

export async function createList(
  db: PluginDatabase,
  user: PluginUser,
  name: string,
  currency: string,
  shopDate: string,
) {
  return db.transaction(async (tx) => {
    const { insertId } = await tx.execute(
      'INSERT INTO lists (name, currency, shop_date, owner_user_id) VALUES (?, ?, ?, ?)',
      [name, currency, shopDate, user.id],
    );
    await tx.execute(
      "INSERT INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'owner', ?)",
      [insertId, user.id, user.displayName],
    );
    return insertId;
  });
}

/** The list's active invite code, creating one if needed. */
export async function activeInvite(db: Db, listId: number, createdBy: number): Promise<string> {
  const [existing] = await db.query<{ code: string }>(
    'SELECT code FROM list_invites WHERE list_id = ? AND revoked_at IS NULL ORDER BY id DESC LIMIT 1',
    [listId],
  );
  if (existing) return existing.code;
  return rotateInvite(db, listId, createdBy);
}

/** Revokes every code of the list and issues a new one (old links stop working). */
export async function rotateInvite(db: Db, listId: number, createdBy: number): Promise<string> {
  await db.execute(
    'UPDATE list_invites SET revoked_at = UTC_TIMESTAMP() WHERE list_id = ? AND revoked_at IS NULL',
    [listId],
  );
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newInviteCode(randomInt);
    try {
      await db.execute('INSERT INTO list_invites (list_id, code, created_by) VALUES (?, ?, ?)', [
        listId,
        code,
        createdBy,
      ]);
      return code;
    } catch (err) {
      if ((err as { code?: string }).code !== 'ER_DUP_ENTRY') throw err;
    }
  }
  throw new Error('Could not create an invite code');
}

export async function listByInvite(db: Db, code: string) {
  const [row] = await db.query<{ id: number; name: string; owner: string; members: number }>(
    `SELECT l.id, l.name,
            (SELECT display_name FROM list_members WHERE list_id = l.id AND role = 'owner' LIMIT 1) AS owner,
            (SELECT COUNT(*) FROM list_members WHERE list_id = l.id) AS members
       FROM list_invites i JOIN lists l ON l.id = i.list_id
      WHERE i.code = ? AND i.revoked_at IS NULL`,
    [code],
  );
  return row ?? null;
}

/** Joins the list behind an invite code; returns its id. Joining twice is harmless. */
export async function joinByInvite(db: Db, code: string, user: PluginUser): Promise<number> {
  const list = await listByInvite(db, code);
  if (!list) throw new HttpError(404, 'inviteInvalid');
  const result = await db.execute(
    "INSERT IGNORE INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'member', ?)",
    [list.id, user.id, user.displayName],
  );
  if (result.affectedRows > 0) {
    await db.execute(
      "INSERT INTO list_events (list_id, user_id, user_name, kind) VALUES (?, ?, ?, 'member_joined')",
      [list.id, user.id, user.displayName],
    );
    await touch(db, list.id);
  }
  return list.id;
}

/** Items and stores of several lists at once (the "Today" view), by list id. */
export async function itemsOfLists(
  db: Db,
  userId: number,
  listIds: number[],
): Promise<Map<number, { stores: Store[]; items: Item[] }>> {
  const result = new Map<number, { stores: Store[]; items: Item[] }>();
  if (listIds.length === 0) return result;
  const marks = listIds.map(() => '?').join(', ');
  // Only lists the user is a member of, whatever ids were asked for.
  const [stores, items] = await Promise.all([
    db.query<Store & { list_id: number }>(
      `SELECT s.list_id, s.id, s.name, s.type, s.location, s.description
         FROM stores s JOIN list_members m ON m.list_id = s.list_id AND m.user_id = ?
        WHERE s.list_id IN (${marks}) ORDER BY s.name, s.id`,
      [userId, ...listIds],
    ),
    db.query<ItemRow>(
      `SELECT ${ITEM_COLUMNS}
         FROM items i JOIN list_members m ON m.list_id = i.list_id AND m.user_id = ?
         LEFT JOIN item_photos p ON p.item_id = i.id
        WHERE i.list_id IN (${marks}) ORDER BY i.position, i.id`,
      [userId, ...listIds],
    ),
  ]);
  const entry = (id: number) => {
    let e = result.get(id);
    if (!e) {
      e = { stores: [], items: [] };
      result.set(id, e);
    }
    return e;
  };
  for (const { list_id, ...store } of stores) entry(list_id).stores.push(store);
  for (const row of items) entry(row.list_id).items.push(toItem(row));
  return result;
}

/**
 * Everyone on a list, deleted lists included (their people are kept in deleted_list_members).
 * ONLY for statistics: it never gives access to a list.
 */
const STATS_MEMBERS = `(SELECT list_id, user_id, display_name FROM list_members
   UNION ALL SELECT list_id, user_id, display_name FROM deleted_list_members)`;

/**
 * Raw rows for the statistics tab (lib/stats.ts): everything on the lists the user is on, and
 * on deleted lists they were on, so deleting a list keeps the spending statistics.
 */
export async function statsInput(db: Db, userId: number): Promise<StatsInput> {
  const mine = `JOIN ${STATS_MEMBERS} me ON me.list_id = x.list_id AND me.user_id = ?`;
  const [lists, members, items, stores] = await Promise.all([
    db.query<{
      id: number;
      name: string;
      currency: string;
      shop_date: string;
      deleted: number | string;
    }>(
      `SELECT l.id, l.name, l.currency, ${SHOP_DATE}, l.deleted_at IS NOT NULL AS deleted
         FROM lists l JOIN ${STATS_MEMBERS} me ON me.list_id = l.id AND me.user_id = ?`,
      [userId],
    ),
    db.query<{ list_id: number; user_id: number; display_name: string }>(
      `SELECT x.list_id, x.user_id, x.display_name FROM ${STATS_MEMBERS} x ${mine}
        WHERE x.user_id <> ?`,
      [userId, userId],
    ),
    db.query<{
      list_id: number;
      store_id: number | null;
      name: string;
      unit: string | null;
      quantity: string | number | null;
      price: string | number | null;
      done_at: Date | null;
      dropped_at: Date | null;
      added_by: number | null;
      done_by: number | null;
    }>(
      `SELECT x.list_id, x.store_id, x.name, x.unit, x.quantity, x.price, x.done_at, x.dropped_at, x.added_by, x.done_by
         FROM items x ${mine}`,
      [userId],
    ),
    db.query<{ id: number; name: string; type: string }>(
      `SELECT x.id, x.name, x.type FROM stores x ${mine}`,
      [userId],
    ),
  ]);
  return {
    userId,
    lists: lists.map((l) => ({
      id: l.id,
      name: l.name,
      currency: l.currency,
      shopDate: l.shop_date,
      deleted: Number(l.deleted) === 1,
    })),
    members: members.map((m) => ({
      listId: m.list_id,
      userId: m.user_id,
      displayName: m.display_name,
    })),
    items: items.map((i) => ({
      listId: i.list_id,
      storeId: i.store_id,
      name: i.name,
      unit: i.unit,
      quantity: i.quantity === null ? null : Number(i.quantity),
      price: i.price === null ? null : Number(i.price),
      done: i.done_at !== null,
      dropped: i.dropped_at !== null,
      addedBy: i.added_by,
      doneBy: i.done_by,
    })),
    stores,
  };
}

/** The user's product history for suggestions (lib/suggestions.ts), newest first. */
export async function suggestionRows(db: Db, userId: number): Promise<SuggestionRow[]> {
  const rows = await db.query<{
    item_id: number;
    list_id: number;
    shop_date: string;
    name: string;
    unit: string | null;
    quantity: string | number | null;
    price: string | number | null;
    description: string | null;
    store_name: string | null;
    store_type: string | null;
    store_location: string | null;
    store_description: string | null;
    photo_v: number | string | null;
  }>(
    `SELECT i.id AS item_id, i.list_id, ${SHOP_DATE}, i.name, i.unit, i.quantity, i.price,
            i.description, s.name AS store_name, s.type AS store_type,
            s.location AS store_location, s.description AS store_description,
            UNIX_TIMESTAMP(p.updated_at) AS photo_v
       FROM items i
       JOIN lists l ON l.id = i.list_id
       JOIN list_members me ON me.list_id = i.list_id AND me.user_id = ?
       LEFT JOIN stores s ON s.id = i.store_id
       LEFT JOIN item_photos p ON p.item_id = i.id
      ORDER BY l.shop_date DESC, i.id DESC
      LIMIT 1500`,
    [userId],
  );
  return rows.map((r) => ({
    itemId: r.item_id,
    listId: r.list_id,
    shopDate: r.shop_date,
    name: r.name,
    unit: r.unit,
    quantity: r.quantity === null ? null : Number(r.quantity),
    price: r.price === null ? null : Number(r.price),
    description: r.description,
    storeName: r.store_name,
    storeType: r.store_type,
    storeLocation: r.store_location,
    storeDescription: r.store_description,
    photo: r.photo_v === null ? null : photoUrl(r.list_id, r.item_id, Number(r.photo_v)),
  }));
}

/**
 * Changes on any of the user's lists, as one short fingerprint: the home screen polls it and
 * reloads when it differs (new list, someone ticked an item, the user was added to a list...).
 */
export async function changesFingerprint(db: Db, userId: number): Promise<string> {
  const [row] = await db.query<{ lists: number | string; versions: number | string | null }>(
    `SELECT COUNT(*) AS lists, SUM(l.version) AS versions
       FROM lists l JOIN list_members m ON m.list_id = l.id AND m.user_id = ?`,
    [userId],
  );
  return `${Number(row?.lists ?? 0)}:${Number(row?.versions ?? 0)}`;
}

export type ListEvent = ActivityEvent;

/**
 * What other people did on the user's lists (in-app notifications), newest first. With `after`
 * only newer events; without it the latest ones (the bell's history).
 */
export async function eventsForUser(
  db: Db,
  userId: number,
  after: number | null,
  limit = 20,
): Promise<ListEvent[]> {
  const rows = await db.query<{
    id: number | string;
    list_id: number;
    list_name: string;
    user_name: string | null;
    kind: string;
    item_name: string | null;
    at: string;
  }>(
    `SELECT e.id, e.list_id, l.name AS list_name, e.user_name, e.kind, e.item_name,
            DATE_FORMAT(e.created_at, '%Y-%m-%dT%H:%i:%sZ') AS at
       FROM list_events e
       JOIN list_members m ON m.list_id = e.list_id AND m.user_id = ?
       JOIN lists l ON l.id = e.list_id
       LEFT JOIN notification_clears c ON c.user_id = ?
      WHERE (e.user_id IS NULL OR e.user_id <> ?) AND e.id > ?
        AND e.id > COALESCE(c.cleared_up_to, 0)
        AND NOT EXISTS (SELECT 1 FROM notification_dismissals d
                         WHERE d.user_id = ? AND d.event_id = e.id)
      ORDER BY e.id DESC
      LIMIT ${Math.max(1, Math.min(limit, 50))}`,
    [userId, userId, userId, after ?? 0, userId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    listId: r.list_id,
    listName: r.list_name,
    userName: r.user_name,
    kind: r.kind,
    itemName: r.item_name,
    at: r.at,
  }));
}

/**
 * "Clear all" in the bell: every notification up to `upTo` (the newest one the person saw) is
 * gone for them, on every device. Newer ones still arrive.
 */
export async function clearEvents(db: Db, userId: number, upTo: number) {
  await db.execute(
    `INSERT INTO notification_clears (user_id, cleared_up_to) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE cleared_up_to = GREATEST(cleared_up_to, VALUES(cleared_up_to))`,
    [userId, upTo],
  );
  // Single removals below the new line are no longer needed.
  await db.execute('DELETE FROM notification_dismissals WHERE user_id = ? AND event_id <= ?', [
    userId,
    upTo,
  ]);
}

/** Removes one notification from the person's bell (only one they can see). */
export async function dismissEvent(db: Db, userId: number, eventId: number) {
  await db.execute(
    `INSERT IGNORE INTO notification_dismissals (user_id, event_id)
     SELECT ?, e.id FROM list_events e
       JOIN list_members m ON m.list_id = e.list_id AND m.user_id = ?
      WHERE e.id = ?`,
    [userId, userId, eventId],
  );
}

/**
 * The price history of every list the user is on, or was on when it was deleted (statistics
 * only, like statsInput), for lib/prices.ts.
 */
export async function priceHistory(db: Db, userId: number): Promise<PriceObservation[]> {
  const rows = await db.query<{
    product: string;
    unit: string | null;
    currency: string;
    kind: 'estimate' | 'actual';
    price: string | number;
    observed_on: string;
    item_id: number | null;
  }>(
    `SELECT o.product, o.unit, l.currency, o.kind, o.price,
            DATE_FORMAT(o.observed_on, '%Y-%m-%d') AS observed_on, o.item_id
       FROM price_observations o
       JOIN lists l ON l.id = o.list_id
      WHERE o.list_id IN (SELECT list_id FROM ${STATS_MEMBERS} me WHERE me.user_id = ?)
      ORDER BY o.observed_on, o.id
      LIMIT 5000`,
    [userId],
  );
  return rows.map((r) => ({
    product: r.product,
    unit: r.unit,
    currency: r.currency,
    kind: r.kind,
    price: Number(r.price),
    observedOn: r.observed_on,
    itemId: r.item_id === null ? null : Number(r.item_id),
  }));
}
