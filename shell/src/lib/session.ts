import 'server-only';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { database, queryOne } from './db';
import { randomToken, sha256 } from './passwords';
import { APP } from '@/generated/app';
import { domainSetting } from './env';
import { cookieDomain } from './hosts';
import { isHttps } from './url';

// Sign-in sessions: a random token in an httpOnly cookie, only its hash in the database.

export const SESSION_COOKIE = 'dq_instance_session';
const DAYS = 30;

export interface SessionUser {
  id: number;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  expiresAt: Date;
  tokenHash: string;
}

interface Row {
  id: number;
  email: string;
  display_name: string;
  role: 'admin' | 'member';
  expires_at: Date | string;
  last_seen_at: Date | string | null;
}

/** The signed-in person, or null (cached per request). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const tokenHash = sha256(token);
  const row = await queryOne<Row>(
    `SELECT u.id, u.email, u.display_name, u.role, s.expires_at, u.last_seen_at
       FROM dq_sessions s JOIN dq_users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.active = 1`,
    [tokenHash],
  );
  if (!row) return null;
  // "Last active" for the apps' scheduled work (lastActiveAt), at most every 10 minutes.
  const seen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
  if (Date.now() - seen > 10 * 60_000) {
    await database()
      .execute('UPDATE dq_users SET last_seen_at = UTC_TIMESTAMP() WHERE id = ?', [row.id])
      .catch(() => undefined);
  }
  return {
    id: Number(row.id),
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    expiresAt: new Date(row.expires_at),
    tokenHash,
  };
});

/** Signs `userId` in: a new session and its cookie (server actions and route handlers only). */
export async function startSession(userId: number): Promise<void> {
  const token = randomToken();
  const expires = new Date(Date.now() + DAYS * 86_400_000);
  await database().execute(
    'INSERT INTO dq_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    [sha256(token), userId, expires],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps(await headers()),
    path: '/',
    expires,
    // Several apps on their own hostnames share the sign-in (ADR 0056).
    domain: cookieDomain(APP.multi, domainSetting()),
  });
  // Old sessions of this person are cleaned up now and then.
  await database()
    .execute('DELETE FROM dq_sessions WHERE user_id = ? AND expires_at < UTC_TIMESTAMP()', [userId])
    .catch(() => undefined);
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await database().execute('DELETE FROM dq_sessions WHERE token_hash = ?', [sha256(token)]);
  }
  jar.set(SESSION_COOKIE, '', {
    path: '/',
    maxAge: 0,
    domain: cookieDomain(APP.multi, domainSetting()),
  });
}

/** Pushes the session's end to at least `hours` from now (PluginSession.extend). */
export async function extendSession(user: SessionUser, hours: number): Promise<Date> {
  const end = new Date(Date.now() + Math.min(Math.max(hours, 1), 24 * DAYS) * 3_600_000);
  if (end <= user.expiresAt) return user.expiresAt;
  await database().execute('UPDATE dq_sessions SET expires_at = ? WHERE token_hash = ?', [
    end,
    user.tokenHash,
  ]);
  return end;
}
