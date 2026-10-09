// The outbox: changes an app could not send yet (offline, the page closing), kept on this device
// until they reach the server. Same-origin requests only; every one must be safe to repeat (the
// server ignores a change it already has). Client-only (no React).
//
// Keys:
//   dq-outbox:<name>  a request to send: { url, method, body, at }
//   dq-keep:<name>    something to keep on this device through a sign-out (e.g. a form draft),
//                     but not to send
// Both survive signing out (ClientDataGuard) and are dropped when someone else signs in on this
// device. While a site holds outbox entries it is listed in the shared `dq_pending` cookie, so
// devquake.com knows which apps to visit (/dq-sync) before signing out and after signing in.

export const OUTBOX_PREFIX = 'dq-outbox:';
export const KEEP_PREFIX = 'dq-keep:';
export const PENDING_COOKIE = 'dq_pending';

export interface OutboxEntry {
  /** Same-origin path, e.g. "/api/sessions/12/ops". */
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** When it was queued (ms). */
  at: number;
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** This site's name in `dq_pending`: the app's subdomain, or "site" for devquake.com. */
function siteName(): string {
  const parts = window.location.hostname.split('.');
  const isIp = /^\d+$/.test(parts.at(-1) ?? '');
  if (isIp) return 'site';
  // workout.devquake.com → workout; workout.localhost → workout; devquake.com → site.
  const rootParts = parts.at(-1) === 'localhost' ? 1 : 2;
  return parts.length > rootParts ? parts[0]! : 'site';
}

function cookieDomain(): string {
  const parts = window.location.hostname.split('.');
  return parts.length >= 2 && !/^\d+$/.test(parts.at(-1)!) && parts.at(-1) !== 'localhost'
    ? `; domain=.${parts.slice(-2).join('.')}`
    : '';
}

/** The sites listed in the shared `dq_pending` cookie. */
export function pendingSites(): string[] {
  const match = document.cookie.match(/(?:^|;\s*)dq_pending=([^;]*)/);
  return match
    ? decodeURIComponent(match[1]!)
        .split(',')
        .filter((s) => /^[a-z0-9-]{1,40}$/.test(s))
    : [];
}

/** Adds or removes this site from `dq_pending`, as its outbox fills or empties. */
function markPending(pending: boolean) {
  try {
    const me = siteName();
    const sites = new Set(pendingSites());
    if (pending === sites.has(me)) return;
    if (pending) sites.add(me);
    else sites.delete(me);
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    const value = [...sites].join(',');
    document.cookie = value
      ? `${PENDING_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 60}; samesite=lax${cookieDomain()}${secure}`
      : `${PENDING_COOKIE}=; path=/; max-age=0; samesite=lax${cookieDomain()}${secure}`;
  } catch {
    // Cookies blocked: the outbox still works on this site, only devquake.com cannot see it.
  }
}

export function putOutbox(name: string, entry: Omit<OutboxEntry, 'at'>): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(OUTBOX_PREFIX + name, JSON.stringify({ ...entry, at: Date.now() }));
    markPending(true);
  } catch {
    // Storage full or blocked: the change cannot be kept.
  }
}

export function getOutbox(name: string): OutboxEntry | null {
  try {
    const raw = storage()?.getItem(OUTBOX_PREFIX + name);
    return raw ? (JSON.parse(raw) as OutboxEntry) : null;
  } catch {
    return null;
  }
}

export function removeOutbox(name: string): void {
  try {
    storage()?.removeItem(OUTBOX_PREFIX + name);
  } catch {
    // nothing to remove
  }
  markPending(outboxNames().length > 0);
}

/** The names of the waiting entries. */
export function outboxNames(): string[] {
  const store = storage();
  if (!store) return [];
  const names: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key?.startsWith(OUTBOX_PREFIX)) names.push(key.slice(OUTBOX_PREFIX.length));
  }
  return names;
}

/**
 * Sends every waiting entry. Sent ones (and ones the server will never accept, a 4xx other than
 * 401, 408 and 429) are removed; the rest stay for the next try. Returns how many are left.
 */
export async function flushOutbox(): Promise<number> {
  for (const name of outboxNames()) {
    const entry = getOutbox(name);
    if (!entry || typeof entry.url !== 'string' || !entry.url.startsWith('/')) {
      removeOutbox(name);
      continue;
    }
    const res = await fetch(entry.url, {
      method: entry.method,
      headers: entry.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: entry.body === undefined ? undefined : JSON.stringify(entry.body),
      credentials: 'same-origin',
      cache: 'no-store',
    }).catch(() => null);
    if (!res) continue; // offline: keep it
    const keep = res.status >= 500 || [401, 408, 429].includes(res.status);
    if (!keep) removeOutbox(name);
  }
  markPending(outboxNames().length > 0);
  return outboxNames().length;
}

/** The page is closing: hand the waiting POSTs to the browser to send in the background. */
export function beaconOutbox(): void {
  if (typeof navigator === 'undefined' || !('sendBeacon' in navigator)) return;
  for (const name of outboxNames()) {
    const entry = getOutbox(name);
    if (!entry || entry.method !== 'POST' || !entry.url.startsWith('/')) continue;
    const body = new Blob([JSON.stringify(entry.body ?? {})], { type: 'application/json' });
    // Kept: a beacon's result is unknown; the next flush sends it again (safe to repeat).
    navigator.sendBeacon(entry.url, body);
  }
}

/** Whether a storage key is kept through a sign-out (outbox and keep entries). */
export function isKeptKey(key: string): boolean {
  return key.startsWith(OUTBOX_PREFIX) || key.startsWith(KEEP_PREFIX);
}
