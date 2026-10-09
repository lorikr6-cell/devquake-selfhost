import { HttpError } from './http';

// Checks of what members type in the dashboard. Pure.

export const NAME_MAX = 80;
export const SERVER_IPS_MAX = 10;

/** A trimmed, required text of at most `max` characters. */
export function text(value: unknown, field: string, max: number): string {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) throw new HttpError(400, 'required', { field });
  if (v.length > max) throw new HttpError(400, 'tooLong', { field, max });
  return v;
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6 = /^[0-9a-f:]{2,39}$/i;

/** "1.2.3.4, 2001:db8::1" → a list of distinct IP addresses (throws on a bad one). */
export function serverIps(value: unknown): string[] {
  if (value === null || value === undefined || value === '') return [];
  const raw = Array.isArray(value) ? value : String(value).split(/[\s,;]+/);
  const list = [...new Set(raw.map((v) => String(v).trim()).filter(Boolean))];
  if (list.length > SERVER_IPS_MAX) throw new HttpError(400, 'ipLimit', { max: SERVER_IPS_MAX });
  for (const ip of list) {
    if (!IPV4.test(ip) && !(IPV6.test(ip) && ip.includes(':'))) {
      throw new HttpError(400, 'ipInvalid', { ip });
    }
  }
  return list;
}

/** An optional boolean setting. */
export function flag(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/** A positive id from a route parameter (404 otherwise). */
export function routeId(value: string | undefined): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'appNotFound');
  return n;
}
