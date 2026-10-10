import {
  buyerCookie,
  buyerBySession,
  buyerOfMember,
  SESSION_DAYS,
  SIGNED_OUT,
  type Buyer,
} from './buyers-data';
import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { WindowCounter } from './rate';

// The buyer's session cookie (ADR 0058): HttpOnly, one name per shop, SameSite=Lax so the link
// from the sign-in email works.

export function sessionCookie(storeId: number, token: string, baseUrl: string): string {
  const secure = baseUrl.startsWith('https:') ? '; Secure' : '';
  return `${buyerCookie(storeId)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}

/** Signing out: no session, and no recognising a connected DevQuake member (ADR 0059). */
export function signedOutCookie(storeId: number, baseUrl: string): string {
  const secure = baseUrl.startsWith('https:') ? '; Secure' : '';
  return `${buyerCookie(storeId)}=${SIGNED_OUT}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}

/**
 * The buyer of this browser in a shop: their session cookie, else the account the signed-in
 * DevQuake member connected before (ADR 0059), unless they signed out of it on this browser.
 */
export async function resolveBuyer(
  db: Omit<PluginDatabase, 'transaction'>,
  storeId: number,
  token: string | null | undefined,
  user: PluginUser | null | undefined,
): Promise<Buyer | null> {
  const buyer = await buyerBySession(db, storeId, token);
  if (buyer || !user || token === SIGNED_OUT) return buyer;
  return buyerOfMember(db, storeId, user.id);
}

export function clearedCookie(storeId: number, baseUrl: string): string {
  const secure = baseUrl.startsWith('https:') ? '; Secure' : '';
  return `${buyerCookie(storeId)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/** Emails one address (or one IP address) may cause per hour: no mail bombs. */
export const mailsPerAddress = new WindowCounter(60 * 60_000, 5);

/** True while both the address and the caller are under the limit (records one hit each). */
export function mayMail(kind: string, storeId: number, email: string, ip: string): boolean {
  const now = Date.now();
  const byAddress = mailsPerAddress.hit(`${kind}:${storeId}:${email}`, now);
  const byCaller = mailsPerAddress.hit(`ip:${ip}`, now);
  return byAddress && byCaller;
}
