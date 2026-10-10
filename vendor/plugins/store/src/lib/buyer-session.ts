import { buyerCookie, SESSION_DAYS } from './buyers-data';
import { WindowCounter } from './rate';

// The buyer's session cookie (ADR 0058): HttpOnly, one name per shop, SameSite=Lax so the link
// from the sign-in email works.

export function sessionCookie(storeId: number, token: string, baseUrl: string): string {
  const secure = baseUrl.startsWith('https:') ? '; Secure' : '';
  return `${buyerCookie(storeId)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
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
