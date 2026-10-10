import { createHash, randomBytes } from 'node:crypto';
import type { PluginDatabase } from '@devquake/plugin-sdk';
import { HttpError } from './http';
import { INVITE_DAYS, TEAM_LIMIT, parseRoles, type StaffRole } from './roles';

// The shop's team (ADR 0058): members the owner invites with a one-time link, each with one or
// more roles (a MySQL SET). Only the link's SHA-256 is stored. SQL with ? placeholders only.

type Db = Omit<PluginDatabase, 'transaction'>;
const num = (v: unknown) => Number(v ?? 0);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

export const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');
export const INVITE_CODE = /^[A-Za-z0-9_-]{32}$/;

export interface StaffMember {
  userId: number;
  displayName: string;
  roles: StaffRole[];
  since: string;
}

export interface Invite {
  /** The first characters of the hash, to tell invitations apart (never the code). */
  id: string;
  roles: StaffRole[];
  expiresAt: string;
}

export async function listStaff(db: Db, storeId: number): Promise<StaffMember[]> {
  const rows = await db.query<{
    user_id: number;
    display_name: string;
    roles: string;
    created_at: Date;
  }>('SELECT * FROM store_staff WHERE store_id = ? ORDER BY created_at', [storeId]);
  return rows.map((r) => ({
    userId: num(r.user_id),
    displayName: r.display_name,
    roles: parseRoles(r.roles),
    since: iso(r.created_at) ?? '',
  }));
}

export async function listInvites(db: Db, storeId: number): Promise<Invite[]> {
  const rows = await db.query<{ code_hash: string; roles: string; expires_at: Date }>(
    'SELECT code_hash, roles, expires_at FROM store_invites WHERE store_id = ? AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC',
    [storeId],
  );
  return rows.map((r) => ({
    id: r.code_hash.slice(0, 12),
    roles: parseRoles(r.roles),
    expiresAt: iso(r.expires_at) ?? '',
  }));
}

/** A new invitation; the code is shown once, in the link. */
export async function createInvite(
  db: Db,
  storeId: number,
  roles: StaffRole[],
  createdBy: number,
): Promise<string> {
  const [{ n } = { n: 0 }] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM store_staff WHERE store_id = ?',
    [storeId],
  );
  if (num(n) >= TEAM_LIMIT) throw new HttpError(409, 'teamFull', { max: TEAM_LIMIT });
  await db.execute('DELETE FROM store_invites WHERE expires_at <= UTC_TIMESTAMP()');
  const code = randomBytes(24).toString('base64url');
  await db.execute(
    `INSERT INTO store_invites (code_hash, store_id, roles, created_by, expires_at)
     VALUES (?, ?, ?, ?, UTC_TIMESTAMP() + INTERVAL ${INVITE_DAYS} DAY)`,
    [hashCode(code), storeId, roles.join(','), createdBy],
  );
  return code;
}

export async function revokeInvite(db: Db, storeId: number, id: string): Promise<void> {
  if (!/^[0-9a-f]{12}$/.test(id)) throw new HttpError(404, 'notFound');
  await db.execute('DELETE FROM store_invites WHERE store_id = ? AND LEFT(code_hash, 12) = ?', [
    storeId,
    id,
  ]);
}

/** The invitation's store name and roles, or null when it is unknown or has expired. */
export async function inviteByCode(
  db: Db,
  code: string,
): Promise<{
  storeId: number;
  storeName: string;
  ownerUserId: number;
  roles: StaffRole[];
} | null> {
  if (!INVITE_CODE.test(code)) return null;
  const [r] = await db.query<{
    store_id: number;
    name: string;
    owner_user_id: number;
    roles: string;
  }>(
    `SELECT i.store_id, s.name, s.owner_user_id, i.roles FROM store_invites i JOIN stores s ON s.id = i.store_id
     WHERE i.code_hash = ? AND i.expires_at > UTC_TIMESTAMP()`,
    [hashCode(code)],
  );
  return r
    ? {
        storeId: num(r.store_id),
        storeName: r.name,
        ownerUserId: num(r.owner_user_id),
        roles: parseRoles(r.roles),
      }
    : null;
}

/**
 * Joins the team with an invitation (used once). A member works on one shop: someone who owns
 * a shop or is on another team cannot join.
 */
export async function acceptInvite(
  db: PluginDatabase,
  code: string,
  user: { id: number; displayName: string },
): Promise<number> {
  const invite = await inviteByCode(db, code);
  if (!invite) throw new HttpError(404, 'inviteGone');
  if (invite.ownerUserId === user.id) throw new HttpError(409, 'ownShop');
  return db.transaction(async (tx) => {
    const [own] = await tx.query<{ id: number }>('SELECT id FROM stores WHERE owner_user_id = ?', [
      user.id,
    ]);
    const [staff] = await tx.query<{ store_id: number }>(
      'SELECT store_id FROM store_staff WHERE user_id = ?',
      [user.id],
    );
    if (own || (staff && num(staff.store_id) !== invite.storeId))
      throw new HttpError(409, 'otherShop');
    const used = await tx.execute('DELETE FROM store_invites WHERE code_hash = ?', [
      hashCode(code),
    ]);
    if (used.affectedRows === 0) throw new HttpError(404, 'inviteGone');
    await tx.execute(
      `INSERT INTO store_staff (store_id, user_id, display_name, roles) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE roles = VALUES(roles), display_name = VALUES(display_name)`,
      [invite.storeId, user.id, user.displayName.slice(0, 80), invite.roles.join(',')],
    );
    return invite.storeId;
  });
}

/** A member's roles (at least one). */
export async function setStaffRoles(
  db: Db,
  storeId: number,
  userId: number,
  roles: StaffRole[],
): Promise<void> {
  const res = await db.execute(
    'UPDATE store_staff SET roles = ? WHERE store_id = ? AND user_id = ?',
    [roles.join(','), storeId, userId],
  );
  if (res.affectedRows === 0) {
    const [r] = await db.query<{ n: number }>(
      'SELECT COUNT(*) AS n FROM store_staff WHERE store_id = ? AND user_id = ?',
      [storeId, userId],
    );
    if (num(r?.n) === 0) throw new HttpError(404, 'notFound');
  }
}

/** Removes a member from the team (or a member leaving it). */
export async function removeStaff(db: Db, storeId: number, userId: number): Promise<void> {
  const res = await db.execute('DELETE FROM store_staff WHERE store_id = ? AND user_id = ?', [
    storeId,
    userId,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
}
