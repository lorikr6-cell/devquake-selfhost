'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { localizePath } from '@devquake/ui';
import { getLocale } from '@/lib/context';
import { PASSWORD_MAX, PASSWORD_MIN, verifyPassword } from '@/lib/passwords';
import { endSession, getSessionUser, startSession } from '@/lib/session';
import {
  createFirstAdmin,
  createInvite,
  findByEmail,
  joinWithInvite,
  removeMember,
} from '@/lib/users';

// The shell's forms. Errors come back as ?error=<code> on the same page (texts in lib/texts).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Account = { email: string; displayName: string; password: string };

function readAccount(form: FormData): Account | { error: string } {
  const displayName = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(form.get('password') ?? '');
  const repeat = String(form.get('repeat') ?? '');
  if (!displayName || displayName.length > 80) return { error: 'invalidName' };
  if (!EMAIL.test(email) || email.length > 190) return { error: 'invalidEmail' };
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return { error: 'invalidPassword' };
  }
  if (password !== repeat) return { error: 'passwordsDiffer' };
  return { email, displayName, password };
}

async function to(path: string, query?: Record<string, string>): Promise<never> {
  const q = query ? `?${new URLSearchParams(query)}` : '';
  redirect(`${localizePath(path, await getLocale())}${q}`);
}

const isDuplicate = (err: unknown) =>
  typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ER_DUP_ENTRY';

/** First run: the admin account, only while there is none. */
export async function setupAction(form: FormData) {
  const account = readAccount(form);
  if ('error' in account) return to('/instance/setup', { error: account.error });
  const id = await createFirstAdmin(account);
  if (id === null) return to('/instance/sign-in');
  await startSession(id);
  return to('/instance/ready');
}

// Sign-in attempts per address and email: 10 in 15 minutes.
const attempts = new Map<string, number[]>();
function tooMany(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < 15 * 60_000);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 5000) attempts.clear();
  return recent.length > 10;
}

/** Only paths of this site, never another address ("//evil.example"). */
function safeNext(value: FormDataEntryValue | null): string {
  const next = String(value ?? '');
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/';
}

export async function signInAction(form: FormData) {
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(form.get('password') ?? '');
  const next = safeNext(form.get('next'));
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'local';
  if (tooMany(`${ip}|${email}`)) return to('/instance/sign-in', { error: 'tooMany', next });
  const user = email && password ? await findByEmail(email) : null;
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return to('/instance/sign-in', { error: 'wrongSignIn', next });
  }
  await startSession(Number(user.id));
  redirect(next);
}

export async function signOutAction() {
  await endSession();
  return to('/instance/sign-in');
}

export async function joinAction(code: string, form: FormData) {
  const account = readAccount(form);
  if ('error' in account) return to(`/instance/join/${code}`, { error: account.error });
  let id: number | null;
  try {
    id = await joinWithInvite(code, account);
  } catch (err) {
    if (isDuplicate(err)) return to(`/instance/join/${code}`, { error: 'emailTaken' });
    throw err;
  }
  if (id === null) return to(`/instance/join/${code}`);
  await startSession(id);
  return to('/');
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return to('/instance/sign-in');
  return user;
}

export async function createInviteAction() {
  const admin = await requireAdmin();
  const code = await createInvite(admin.id);
  return to('/instance', { invite: code });
}

export async function removeMemberAction(form: FormData) {
  await requireAdmin();
  const id = Number(form.get('id'));
  const name = String(form.get('name') ?? '').slice(0, 80);
  if (Number.isSafeInteger(id) && id > 0) await removeMember(id);
  return to('/instance', { removed: name });
}
