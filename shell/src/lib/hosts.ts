// Which app a request is for (ADR 0056 in DevQuake). One app: always that app, at the root of the
// instance's address. Several (Household): the home on the instance's domain and each app on
// `<app>.<domain>`; without a domain, sslip.io names made from PUBLIC_IP. Pure, unit-tested.

export type Place = { kind: 'app'; id: string } | { kind: 'home' } | { kind: 'unknown' };

/** "Example.com:443" → "example.com:443" (no scheme, no path). */
function clean(value: string | undefined): string | null {
  const v = value
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return v && /^[a-z0-9.-]+(:\d+)?$/.test(v) ? v : null;
}

/**
 * The instance's own domain, with a port only in development ("lvh.me:3000"): DOMAIN, else
 * "<ip-with-dashes>.sslip.io" from PUBLIC_IP, else null (only the IP address works then).
 */
export function instanceDomain(env: { DOMAIN?: string; PUBLIC_IP?: string }): string | null {
  const domain = clean(env.DOMAIN);
  if (domain) return domain;
  const ip = env.PUBLIC_IP?.trim();
  if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return `${ip.replace(/\./g, '-')}.sslip.io`;
  return null;
}

const hostname = (hostWithPort: string) => hostWithPort.toLowerCase().replace(/:\d+$/, '');

/** Where a request with this Host goes. */
export function placeOf(
  host: string,
  apps: readonly string[],
  multi: boolean,
  domain: string | null,
): Place {
  if (!multi) return { kind: 'app', id: apps[0]! };
  if (!domain) return { kind: 'home' };
  const name = hostname(host);
  const root = hostname(domain);
  if (name === root) return { kind: 'home' };
  if (name.endsWith(`.${root}`)) {
    const label = name.slice(0, -(root.length + 1));
    return apps.includes(label) ? { kind: 'app', id: label } : { kind: 'unknown' };
  }
  // The bare IP address, or a name we do not know: the home explains what to set.
  return { kind: 'home' };
}

/** An app's address: `<scheme>://<app>.<domain>` (several apps), else the instance's address. */
export function appOrigin(id: string, base: string, multi: boolean, domain: string | null): string {
  if (!multi || !domain) return base;
  const scheme = base.startsWith('https://') ? 'https' : 'http';
  return `${scheme}://${id}.${domain}`;
}

/** The home's address: `<scheme>://<domain>` (several apps), else the instance's address. */
export function homeOrigin(base: string, multi: boolean, domain: string | null): string {
  if (!multi || !domain) return base;
  const scheme = base.startsWith('https://') ? 'https' : 'http';
  return `${scheme}://${domain}`;
}

/** The cookie domain that shares the sign-in between the home and every app (none for one app). */
export function cookieDomain(multi: boolean, domain: string | null): string | undefined {
  if (!multi || !domain) return undefined;
  const name = hostname(domain);
  // Browsers refuse a Domain attribute for localhost and IP addresses.
  if (name === 'localhost' || /^\d+(\.\d+){3}$/.test(name)) return undefined;
  return name;
}
