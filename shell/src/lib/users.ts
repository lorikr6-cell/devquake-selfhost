import 'server-only';
import { PLUGIN_IDS, loadPlugin } from '@/generated/app';
import { database, queryOne } from './db';
import { hashPassword, randomToken, sha256 } from './passwords';

// The instance's people: one admin (created on first run) and the members they invite. A
// single tenant: everyone here uses the one app.

export interface Member {
  id: number;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  createdAt: Date;
  lastSeenAt: Date | null;
}

interface Row {
  id: number;
  email: string;
  display_name: string;
  role: 'admin' | 'member';
  created_at: Date | string;
  last_seen_at: Date | string | null;
}

const toMember = (r: Row): Member => ({
  id: Number(r.id),
  email: r.email,
  displayName: r.display_name,
  role: r.role,
  createdAt: new Date(r.created_at),
  lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at) : null,
});

export async function hasAdmin(): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    "SELECT COUNT(*) AS n FROM dq_users WHERE role = 'admin' AND active = 1",
  );
  return Number(row?.n ?? 0) > 0;
}

export async function listMembers(): Promise<Member[]> {
  const rows = await database().query<Row>(
    `SELECT id, email, display_name, role, created_at, last_seen_at
       FROM dq_users WHERE active = 1 ORDER BY role = 'admin' DESC, display_name`,
  );
  return rows.map(toMember);
}

export async function findByEmail(email: string) {
  return queryOne<Row & { password_hash: string }>(
    'SELECT id, email, display_name, role, created_at, last_seen_at, password_hash FROM dq_users WHERE email = ? AND active = 1',
    [email.trim().toLowerCase()],
  );
}

export async function createUser(input: {
  email: string;
  displayName: string;
  password: string;
  role: 'admin' | 'member';
}): Promise<number> {
  const result = await database().execute(
    'INSERT INTO dq_users (email, display_name, password_hash, role) VALUES (?, ?, ?, ?)',
    [
      input.email.trim().toLowerCase(),
      input.displayName.trim(),
      await hashPassword(input.password),
      input.role,
    ],
  );
  return result.insertId;
}

/** The first admin, only while there is none (the first-run setup). */
export async function createFirstAdmin(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<number | null> {
  return database().transaction(async (tx) => {
    const [row] = await tx.query<{ n: number }>(
      "SELECT COUNT(*) AS n FROM dq_users WHERE role = 'admin' FOR UPDATE",
    );
    if (Number(row?.n ?? 0) > 0) return null;
    const result = await tx.execute(
      "INSERT INTO dq_users (email, display_name, password_hash, role) VALUES (?, ?, ?, 'admin')",
      [
        input.email.trim().toLowerCase(),
        input.displayName.trim(),
        await hashPassword(input.password),
      ],
    );
    return result.insertId;
  });
}

// --- Invites ------------------------------------------------------------------------------------

const INVITE_DAYS = 7;

/** A new invite link code (shown once; only its hash is kept). */
export async function createInvite(adminId: number): Promise<string> {
  const code = randomToken(24);
  await database().execute(
    'INSERT INTO dq_invites (code_hash, created_by, expires_at) VALUES (?, ?, ?)',
    [sha256(code), adminId, new Date(Date.now() + INVITE_DAYS * 86_400_000)],
  );
  return code;
}

export async function inviteIsOpen(code: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(code)) return false;
  const row = await queryOne<{ n: number }>(
    'SELECT COUNT(*) AS n FROM dq_invites WHERE code_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()',
    [sha256(code)],
  );
  return Number(row?.n ?? 0) > 0;
}

/** Joins with an invite: the account, once per code. Null when the code is used or expired. */
export async function joinWithInvite(
  code: string,
  input: { email: string; displayName: string; password: string },
): Promise<number | null> {
  const hash = sha256(code);
  const passwordHash = await hashPassword(input.password);
  return database().transaction(async (tx) => {
    const [invite] = await tx.query<{ code_hash: string }>(
      'SELECT code_hash FROM dq_invites WHERE code_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP() FOR UPDATE',
      [hash],
    );
    if (!invite) return null;
    const result = await tx.execute(
      "INSERT INTO dq_users (email, display_name, password_hash, role) VALUES (?, ?, ?, 'member')",
      [input.email.trim().toLowerCase(), input.displayName.trim(), passwordHash],
    );
    await tx.execute(
      'UPDATE dq_invites SET used_by = ?, used_at = UTC_TIMESTAMP() WHERE code_hash = ?',
      [result.insertId, hash],
    );
    return result.insertId;
  });
}

/**
 * Removes a member (never the admin). The app first deletes what is theirs alone; with
 * contributions others still see, it keeps them under a "REMOVED_…" name (ADR 0042 on DevQuake).
 */
export async function removeMember(userId: number): Promise<void> {
  const target = await queryOne<{ role: string }>(
    'SELECT role FROM dq_users WHERE id = ? AND active = 1',
    [userId],
  );
  if (!target || target.role === 'admin') return;
  const apps = await Promise.all(
    PLUGIN_IDS.map(async (id) => {
      const plugin = await loadPlugin(id);
      return {
        hooks: plugin.platform ? await plugin.platform() : {},
        ctx: { pluginId: id, db: database(id) },
      };
    }),
  );
  const alias = `REMOVED_${userId}`;
  // Kept under an alias when any app still shows what they added for others (ADR 0042).
  let keep = false;
  for (const { hooks, ctx } of apps) {
    if (hooks.hasContributions && (await hooks.hasContributions(userId, ctx))) keep = true;
  }
  if (keep) {
    for (const { hooks, ctx } of apps) {
      if (hooks.anonymizeUserData) await hooks.anonymizeUserData(userId, alias, ctx);
      else if (hooks.deleteUserData) await hooks.deleteUserData(userId, ctx);
    }
    await database().execute(
      "UPDATE dq_users SET active = 0, display_name = ?, email = CONCAT('removed-', id, '@invalid'), password_hash = '' WHERE id = ?",
      [alias, userId],
    );
    await database().execute('DELETE FROM dq_sessions WHERE user_id = ?', [userId]);
    return;
  }
  for (const { hooks, ctx } of apps) {
    if (hooks.deleteUserData) await hooks.deleteUserData(userId, ctx);
  }
  await database().execute('DELETE FROM dq_users WHERE id = ?', [userId]);
}
