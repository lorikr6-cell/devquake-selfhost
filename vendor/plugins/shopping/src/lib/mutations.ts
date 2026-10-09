import type { PluginDatabase, PluginPeople, PluginUser } from '@devquake/plugin-sdk';
import { requireMember, requireOwner, touch } from './data';
import { HttpError } from './http';
import { MAX_PHOTO_BYTES, sniffPhoto } from './photos';
import { ensureLogo } from './logos';
import type { ItemInput, StoreInput } from './validate';

/**
 * Changes to a list. Each one checks membership (or ownership) first and bumps the list's
 * version so other open copies refresh.
 */

type Db = Omit<PluginDatabase, 'transaction'>;

async function requireStore(db: Db, listId: number, storeId: number | null) {
  if (storeId === null) return;
  const [row] = await db.query('SELECT id FROM stores WHERE id = ? AND list_id = ?', [
    storeId,
    listId,
  ]);
  if (!row) throw new HttpError(400, 'storeNotOnList');
}

async function requireItem(db: Db, listId: number, itemId: number) {
  const [row] = await db.query<{ name: string; price: string | number | null }>(
    'SELECT name, price FROM items WHERE id = ? AND list_id = ?',
    [itemId, listId],
  );
  if (!row) throw new HttpError(404, 'itemNotFound');
  return { name: row.name, price: row.price === null ? null : Number(row.price) };
}

/**
 * Records a price in the history (lib/prices.ts), dated with the list's shopping day:
 * 'estimate' when planned, 'actual' when corrected in the store.
 */
async function observePrice(
  db: Db,
  listId: number,
  itemId: number,
  userId: number,
  kind: 'estimate' | 'actual',
  price: number,
) {
  await db.execute(
    `INSERT INTO price_observations (list_id, item_id, user_id, product, unit, store_name, kind, price, observed_on)
     SELECT i.list_id, i.id, ?, i.name, i.unit, s.name, ?, ?, l.shop_date
       FROM items i JOIN lists l ON l.id = i.list_id LEFT JOIN stores s ON s.id = i.store_id
      WHERE i.id = ? AND i.list_id = ?`,
    [userId, kind, price, itemId, listId],
  );
}

export type EventKind =
  | 'item_added'
  | 'item_done'
  | 'item_dropped'
  | 'item_removed'
  | 'price_set'
  | 'price_corrected'
  | 'photo_added'
  | 'member_joined'
  | 'member_left';

/**
 * Remembers who did what for the in-app notifications of the other members. Old events are
 * pruned now and then (kept 30 days).
 */
export async function recordEvent(
  db: Db,
  listId: number,
  user: PluginUser,
  kind: EventKind,
  itemName: string | null = null,
) {
  await db.execute(
    'INSERT INTO list_events (list_id, user_id, user_name, kind, item_name) VALUES (?, ?, ?, ?, ?)',
    [listId, user.id, user.displayName, kind, itemName],
  );
  if (Math.random() < 0.02) {
    await db.execute(
      'DELETE FROM list_events WHERE created_at < UTC_TIMESTAMP() - INTERVAL 30 DAY LIMIT 1000',
    );
  }
}

// --- list ---------------------------------------------------------------------------------

export async function updateList(
  db: Db,
  listId: number,
  user: PluginUser,
  changes: { name?: string; currency?: string; shopDate?: string },
) {
  await requireOwner(db, listId, user.id);
  if (changes.shopDate !== undefined) {
    await db.execute('UPDATE lists SET shop_date = ? WHERE id = ?', [changes.shopDate, listId]);
  }
  if (changes.name !== undefined) {
    await db.execute('UPDATE lists SET name = ? WHERE id = ?', [changes.name, listId]);
  }
  if (changes.currency !== undefined) {
    await db.execute('UPDATE lists SET currency = ? WHERE id = ?', [changes.currency, listId]);
  }
  await touch(db, listId);
}

/**
 * Deletes a list for everyone (owner only). Memberships, invites, notifications and photos go;
 * the list with its items and stores stays, marked deleted, so everyone's spending statistics
 * stay the same. Who was on it moves to deleted_list_members, read only by the statistics.
 */
export async function deleteList(db: PluginDatabase, listId: number, user: PluginUser) {
  await db.transaction(async (tx) => {
    await requireOwner(tx, listId, user.id);
    await tx.execute(
      `INSERT IGNORE INTO deleted_list_members (list_id, user_id, role, display_name, joined_at)
       SELECT list_id, user_id, role, display_name, joined_at FROM list_members WHERE list_id = ?`,
      [listId],
    );
    await tx.execute('DELETE FROM list_members WHERE list_id = ?', [listId]);
    await tx.execute('DELETE FROM list_invites WHERE list_id = ?', [listId]);
    await tx.execute('DELETE FROM list_events WHERE list_id = ?', [listId]);
    await tx.execute(
      'DELETE p FROM item_photos p JOIN items i ON i.id = p.item_id WHERE i.list_id = ?',
      [listId],
    );
    await tx.execute(
      'UPDATE lists SET deleted_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ?',
      [listId],
    );
  });
}

// --- items --------------------------------------------------------------------------------

/**
 * Adds an item. `photoFrom` copies the photo of an earlier item (from a suggestion), but only
 * from a list the user is on.
 */
export async function addItem(
  db: Db,
  listId: number,
  user: PluginUser,
  input: ItemInput,
  photoFrom: number | null = null,
) {
  await requireMember(db, listId, user.id);
  await requireStore(db, listId, input.storeId);
  const { insertId } = await db.execute(
    `INSERT INTO items (list_id, store_id, name, quantity, unit, price, description, added_by, added_by_name, position)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(position), 0) + 1 FROM items WHERE list_id = ?`,
    [
      listId,
      input.storeId,
      input.name,
      input.quantity,
      input.unit,
      input.price,
      input.description,
      user.id,
      user.displayName,
      listId,
    ],
  );
  await recordEvent(db, listId, user, 'item_added', input.name);
  if (input.price !== null)
    await observePrice(db, listId, insertId, user.id, 'estimate', input.price);
  if (photoFrom !== null) {
    await db.execute(
      `INSERT IGNORE INTO item_photos (item_id, mime, data, bytes, thumb_mime, thumb, uploaded_by)
       SELECT ?, p.mime, p.data, p.bytes, p.thumb_mime, p.thumb, ?
         FROM item_photos p
         JOIN items src ON src.id = p.item_id
         JOIN list_members m ON m.list_id = src.list_id AND m.user_id = ?
        WHERE p.item_id = ?`,
      [insertId, user.id, user.id, photoFrom],
    );
  }
  await touch(db, listId);
  return insertId;
}

// --- photos -------------------------------------------------------------------------------

export async function readPhoto(
  db: Db,
  listId: number,
  itemId: number,
  userId: number,
  thumb = false,
) {
  await requireMember(db, listId, userId);
  // The small version when asked for and stored (ADR 0040); the photo otherwise.
  const [row] = await db.query<{ mime: string; data: Buffer }>(
    `SELECT IF(? AND p.thumb IS NOT NULL, p.thumb_mime, p.mime) AS mime,
            IF(? AND p.thumb IS NOT NULL, p.thumb, p.data) AS data
       FROM item_photos p JOIN items i ON i.id = p.item_id
      WHERE p.item_id = ? AND i.list_id = ?`,
    [thumb ? 1 : 0, thumb ? 1 : 0, itemId, listId],
  );
  if (!row) throw new HttpError(404, 'noPhoto');
  return row;
}

/** Stores (or replaces) an item's photo; any member of the list may do it. */
export async function savePhoto(
  db: Db,
  listId: number,
  itemId: number,
  user: PluginUser,
  bytes: Uint8Array,
  thumb: Uint8Array | null = null,
) {
  await requireMember(db, listId, user.id);
  const item = await requireItem(db, listId, itemId);
  if (bytes.length === 0) throw new HttpError(400, 'choosePhoto');
  if (bytes.length > MAX_PHOTO_BYTES) throw new HttpError(413, 'photoTooLarge');
  const mime = sniffPhoto(bytes);
  if (!mime) throw new HttpError(415, 'photoFormat');
  const thumbMime = thumb ? sniffPhoto(thumb) : null;
  const small = thumbMime && thumb ? Buffer.from(thumb) : null;
  await db.execute(
    `INSERT INTO item_photos (item_id, mime, data, bytes, thumb_mime, thumb, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE mime = ?, data = ?, bytes = ?, thumb_mime = ?, thumb = ?,
       uploaded_by = ?, updated_at = CURRENT_TIMESTAMP`,
    [
      itemId,
      mime,
      Buffer.from(bytes),
      bytes.length,
      thumbMime,
      small,
      user.id,
      mime,
      Buffer.from(bytes),
      bytes.length,
      thumbMime,
      small,
      user.id,
    ],
  );
  await recordEvent(db, listId, user, 'photo_added', item.name);
  await touch(db, listId);
}

export async function deletePhoto(db: Db, listId: number, itemId: number, user: PluginUser) {
  await requireMember(db, listId, user.id);
  await requireItem(db, listId, itemId);
  const { affectedRows } = await db.execute('DELETE FROM item_photos WHERE item_id = ?', [itemId]);
  if (affectedRows > 0) await touch(db, listId);
}

export async function updateItem(
  db: Db,
  listId: number,
  itemId: number,
  user: PluginUser,
  input: Partial<ItemInput> & { done?: boolean; dropped?: boolean },
) {
  await requireMember(db, listId, user.id);
  const before = await requireItem(db, listId, itemId);
  if (input.storeId !== undefined) await requireStore(db, listId, input.storeId);

  const columns: Record<keyof ItemInput, string> = {
    name: 'name',
    quantity: 'quantity',
    unit: 'unit',
    price: 'price',
    description: 'description',
    storeId: 'store_id',
  };
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(columns) as Array<[keyof ItemInput, string]>) {
    if (input[key] !== undefined) {
      sets.push(`${column} = ?`);
      values.push(input[key]);
    }
  }
  if (input.done === true) {
    sets.push('done_at = COALESCE(done_at, UTC_TIMESTAMP())', 'done_by = ?', 'done_by_name = ?');
    values.push(user.id, user.displayName);
  } else if (input.done === false) {
    sets.push('done_at = NULL', 'done_by = NULL', 'done_by_name = NULL');
  }
  // Struck out as not needed (it keeps its "bought" state: then the money is spent anyway).
  if (input.dropped === true) {
    sets.push(
      'dropped_at = COALESCE(dropped_at, UTC_TIMESTAMP())',
      'dropped_by = ?',
      'dropped_by_name = ?',
    );
    values.push(user.id, user.displayName);
  } else if (input.dropped === false) {
    sets.push('dropped_at = NULL', 'dropped_by = NULL', 'dropped_by_name = NULL');
  }
  if (sets.length === 0) return;
  await db.execute(`UPDATE items SET ${sets.join(', ')} WHERE id = ? AND list_id = ?`, [
    ...values,
    itemId,
    listId,
  ]);
  const name = input.name ?? before.name;
  if (input.done === true) await recordEvent(db, listId, user, 'item_done', name);
  if (input.dropped === true) await recordEvent(db, listId, user, 'item_dropped', name);
  if (input.price !== undefined && input.price !== null && input.price !== before.price) {
    await recordEvent(db, listId, user, 'price_set', name);
    await observePrice(db, listId, itemId, user.id, 'estimate', input.price);
  }
  await touch(db, listId);
}

/**
 * "Correct price" while shopping: the price paid in the store replaces the planned one, which is
 * kept as the estimate (the first planned price, if corrected twice). Both are in the price
 * history, so the statistics can show inflation and how good the estimates were.
 */
export async function correctPrice(
  db: Db,
  listId: number,
  itemId: number,
  user: PluginUser,
  price: number,
) {
  await requireMember(db, listId, user.id);
  const before = await requireItem(db, listId, itemId);
  if (before.price !== null) {
    await db.execute(
      `INSERT INTO price_observations (list_id, item_id, user_id, product, unit, store_name, kind, price, observed_on)
       SELECT i.list_id, i.id, ?, i.name, i.unit, s.name, 'estimate', i.price, l.shop_date
         FROM items i JOIN lists l ON l.id = i.list_id LEFT JOIN stores s ON s.id = i.store_id
        WHERE i.id = ? AND i.list_id = ?
          AND NOT EXISTS (SELECT 1 FROM price_observations o WHERE o.item_id = i.id AND o.kind = 'estimate')`,
      [user.id, itemId, listId],
    );
  }
  await db.execute(
    `UPDATE items SET estimated_price = COALESCE(estimated_price, price), price = ?,
            price_corrected_at = UTC_TIMESTAMP(), price_corrected_by = ?, price_corrected_by_name = ?
      WHERE id = ? AND list_id = ?`,
    [price, user.id, user.displayName, itemId, listId],
  );
  await observePrice(db, listId, itemId, user.id, 'actual', price);
  await recordEvent(db, listId, user, 'price_corrected', before.name);
  await touch(db, listId);
}

export async function deleteItem(db: Db, listId: number, itemId: number, user: PluginUser) {
  await requireMember(db, listId, user.id);
  const item = await requireItem(db, listId, itemId);
  await db.execute('DELETE FROM items WHERE id = ? AND list_id = ?', [itemId, listId]);
  await recordEvent(db, listId, user, 'item_removed', item.name);
  await touch(db, listId);
}

export async function clearDone(db: Db, listId: number, user: PluginUser) {
  await requireMember(db, listId, user.id);
  const { affectedRows } = await db.execute(
    'DELETE FROM items WHERE list_id = ? AND (done_at IS NOT NULL OR dropped_at IS NOT NULL)',
    [listId],
  );
  if (affectedRows > 0) await touch(db, listId);
  return affectedRows;
}

// --- stores -------------------------------------------------------------------------------

/** Adds a store to the list, or returns the existing one with the same name and location. */
export async function addStore(db: Db, listId: number, user: PluginUser, input: StoreInput) {
  await requireMember(db, listId, user.id);
  const [existing] = await db.query<{ id: number }>(
    'SELECT id FROM stores WHERE list_id = ? AND name = ? AND location <=> ? LIMIT 1',
    [listId, input.name, input.location],
  );
  if (existing) return existing.id;
  const { insertId } = await db.execute(
    'INSERT INTO stores (list_id, name, type, location, description) VALUES (?, ?, ?, ?, ?)',
    [listId, input.name, input.type, input.location, input.description],
  );
  await touch(db, listId);
  // Its logo, in the background (ADR 0052): the list refreshes for everyone once it is found.
  ensureLogo(
    db,
    {
      name: input.brand.name ?? input.name,
      wikidata: input.brand.wikidata,
      website: input.brand.website,
    },
    () => touch(db, listId),
  );
  return insertId;
}

export async function updateStore(
  db: Db,
  listId: number,
  storeId: number,
  user: PluginUser,
  input: StoreInput,
) {
  await requireMember(db, listId, user.id);
  await requireStore(db, listId, storeId);
  await db.execute(
    'UPDATE stores SET name = ?, type = ?, location = ?, description = ? WHERE id = ? AND list_id = ?',
    [input.name, input.type, input.location, input.description, storeId, listId],
  );
  await touch(db, listId);
}

/** Removes a store; its items stay on the list without a store (ON DELETE SET NULL). */
export async function deleteStore(db: Db, listId: number, storeId: number, user: PluginUser) {
  await requireMember(db, listId, user.id);
  const { affectedRows } = await db.execute('DELETE FROM stores WHERE id = ? AND list_id = ?', [
    storeId,
    listId,
  ]);
  if (affectedRows > 0) await touch(db, listId);
}

// --- members ------------------------------------------------------------------------------

/**
 * The owner adds someone from their DevQuake referral network (ctx.people). Anyone else must
 * join through the invite link. Returns whether the person can already open the app.
 */
export async function addReferralMember(
  db: Db,
  listId: number,
  user: PluginUser,
  people: PluginPeople | undefined,
  personId: number,
) {
  await requireOwner(db, listId, user.id);
  const person = (await people?.referrals())?.find((p) => p.id === personId);
  if (!person) {
    throw new HttpError(403, 'referralOnly');
  }
  const { affectedRows } = await db.execute(
    "INSERT IGNORE INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'member', ?)",
    [listId, person.id, person.displayName],
  );
  if (affectedRows > 0) {
    await recordEvent(
      db,
      listId,
      { ...user, displayName: person.displayName, id: person.id },
      'member_joined',
    );
    await touch(db, listId);
  }
  return { added: affectedRows > 0, hasAccess: person.hasAccess };
}

/** The owner removes a member, or a member leaves. The owner cannot leave (delete the list). */
export async function removeMember(db: Db, listId: number, user: PluginUser, memberId: number) {
  const me = await requireMember(db, listId, user.id);
  if (memberId === user.id) {
    if (me.role === 'owner') {
      throw new HttpError(400, 'ownerCannotLeave');
    }
  } else if (me.role !== 'owner') {
    throw new HttpError(403, 'ownerRemoves');
  }
  const { affectedRows } = await db.execute(
    "DELETE FROM list_members WHERE list_id = ? AND user_id = ? AND role = 'member'",
    [listId, memberId],
  );
  if (affectedRows > 0) {
    if (memberId === user.id) await recordEvent(db, listId, user, 'member_left');
    await touch(db, listId);
  }
}

/**
 * Copies a list to another day: same name, currency, members, stores and items (with their
 * planned prices and descriptions; nothing ticked off or struck out, no photos). The person
 * copying owns the copy; the source's other members are on it too. A list with the same name
 * on that day that the person is already on counts as copied (nothing is created twice).
 * Returns the new list's id, or null when it was already there.
 */
export async function copyList(
  db: PluginDatabase,
  sourceId: number,
  date: string,
  user: PluginUser,
): Promise<number | null> {
  const source = await requireMember(db, sourceId, user.id);
  const [existing] = await db.query<{ id: number }>(
    `SELECT l.id FROM lists l JOIN list_members m ON m.list_id = l.id AND m.user_id = ?
      WHERE l.name = ? AND l.shop_date = ? AND l.deleted_at IS NULL LIMIT 1`,
    [user.id, source.name, date],
  );
  if (existing) return null;
  return db.transaction(async (tx) => {
    const { insertId } = await tx.execute(
      'INSERT INTO lists (name, currency, shop_date, owner_user_id) VALUES (?, ?, ?, ?)',
      [source.name, source.currency, date, user.id],
    );
    await tx.execute(
      "INSERT INTO list_members (list_id, user_id, role, display_name) VALUES (?, ?, 'owner', ?)",
      [insertId, user.id, user.displayName],
    );
    await tx.execute(
      `INSERT IGNORE INTO list_members (list_id, user_id, role, display_name)
       SELECT ?, user_id, 'member', display_name FROM list_members WHERE list_id = ? AND user_id <> ?`,
      [insertId, sourceId, user.id],
    );
    const stores = await tx.query<{ id: number }>(
      'SELECT id FROM stores WHERE list_id = ? ORDER BY id',
      [sourceId],
    );
    const storeMap = new Map<number, number>();
    for (const store of stores) {
      const created = await tx.execute(
        `INSERT INTO stores (list_id, name, type, location, description)
         SELECT ?, name, type, location, description FROM stores WHERE id = ?`,
        [insertId, store.id],
      );
      storeMap.set(store.id, created.insertId);
    }
    const items = await tx.query<{ id: number; store_id: number | null }>(
      'SELECT id, store_id FROM items WHERE list_id = ? ORDER BY position, id',
      [sourceId],
    );
    for (const item of items) {
      await tx.execute(
        `INSERT INTO items (list_id, store_id, name, quantity, unit, price, description, added_by, added_by_name, position)
         SELECT ?, ?, name, quantity, unit, price, description, ?, ?, position FROM items WHERE id = ?`,
        [
          insertId,
          item.store_id === null ? null : (storeMap.get(item.store_id) ?? null),
          user.id,
          user.displayName,
          item.id,
        ],
      );
    }
    return insertId;
  });
}
