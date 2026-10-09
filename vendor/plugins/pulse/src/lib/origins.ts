// Websites allowed to use an app's public key (ADR 0023). Pure except `lookupProof`.

/**
 * The origin of a website address as browsers send it ("https://shop.example.com", no path,
 * default port dropped), or null when it cannot be one. https only, except localhost.
 */
export function normaliseOrigin(input: string): string | null {
  const text = input.trim();
  if (!text || text.length > 200) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  const local = isLocalHost(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return null;
  if (
    !local &&
    !/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(url.hostname)
  ) {
    return null; // a real domain name (no bare IP addresses)
  }
  return url.origin.toLowerCase();
}

export function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
}

/** Is this origin a developer's own computer (http(s)://localhost:port)? */
export function isLocalOrigin(origin: string): boolean {
  try {
    return isLocalHost(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** The DNS name that must hold the TXT proof for an origin: _devquake-pulse.<host>. */
export function proofRecordName(origin: string): string {
  return `_devquake-pulse.${new URL(origin).hostname}`;
}

/** Looks up the TXT records of the proof name (server only). */
export async function lookupProof(origin: string): Promise<string[]> {
  const { resolveTxt } = await import('node:dns/promises');
  try {
    const records = await resolveTxt(proofRecordName(origin));
    return records.map((parts) => parts.join(''));
  } catch {
    return [];
  }
}
