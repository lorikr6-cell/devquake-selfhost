import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// Server only: finds a company's or store's logo without a paid service (ADR 0052). Wikidata
// says which organisation a name is (or OpenStreetMap already did: brand:wikidata) and has its
// logo (P154, a file on Wikimedia Commons, fetched as a PNG thumbnail) and website (P856);
// without a Commons logo, the website's own icon (apple-touch-icon, icon, favicon.ico) is used.
// Only the name or address is sent, never anything about a member. Every fetch is https to a
// public address (no private networks: the server must not be usable to look inside its own
// network), with a timeout, a size limit and image types only. The same file is in the
// shopping and CV Builder apps.

const USER_AGENT = 'DevQuake logo finder (https://devquake.com; contact@devquake.com)';
export const MAX_LOGO_BYTES = 200 * 1024;
const MAX_PAGE_BYTES = 400 * 1024;
const TIMEOUT_MS = 8000;
const LOGO_WIDTH = 128;

/** Raster images only: an SVG could carry script. */
const IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

export interface FoundLogo {
  data: Uint8Array;
  type: string;
  /** Where it came from: 'wikidata' or 'website'. */
  source: 'wikidata' | 'website';
}

export interface LogoHints {
  /** The company or store name. */
  name: string;
  /** A Wikidata item id, e.g. from OpenStreetMap's brand:wikidata ("Q151954"). */
  wikidata?: string | null;
  /** Its website, e.g. from OpenStreetMap or what a member typed. */
  website?: string | null;
}

const fold = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** The key a logo is stored under: "Kaufland România" → "kaufland-romania". */
export function logoKey(name: string): string {
  return fold(name)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// --- Safe fetching -------------------------------------------------------------------------------

/** Loopback, private, link-local, carrier-grade NAT, multicast and other non-public addresses. */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number) as [number, number];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7));
  return (
    v6 === '::' ||
    v6 === '::1' ||
    v6.startsWith('fc') ||
    v6.startsWith('fd') ||
    v6.startsWith('fe8') ||
    v6.startsWith('fe9') ||
    v6.startsWith('fea') ||
    v6.startsWith('feb') ||
    v6.startsWith('ff')
  );
}

async function publicUrl(raw: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  if (url.port && url.port !== '443') return null;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) return isPrivateAddress(host) ? null : url;
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.internal')) return null;
  const addresses = await lookup(host, { all: true }).catch(() => []);
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) return null;
  return url;
}

/** GET a public https address (redirects checked one by one), at most `max` bytes. */
async function safeGet(
  raw: string,
  max: number,
  accept: string,
): Promise<{ body: Uint8Array; type: string; url: string } | null> {
  let current = raw;
  for (let hop = 0; hop < 4; hop++) {
    const url = await publicUrl(current);
    if (!url) return null;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: accept },
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    }).catch(() => null);
    if (!res) return null;
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      if (!next) return null;
      current = new URL(next, url).href;
      continue;
    }
    if (!res.ok || !res.body) return null;
    if (Number(res.headers.get('content-length') ?? 0) > max) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) {
      body.set(c, at);
      at += c.byteLength;
    }
    const type = (res.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase();
    return { body, type, url: url.href };
  }
  return null;
}

/** The image's real type from its first bytes (the header can lie), or null. */
export function sniffImage(b: Uint8Array): string | null {
  if (b.length < 4) return null;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return 'image/x-icon';
  if (
    b.length >= 12 &&
    String.fromCharCode(b[0]!, b[1]!, b[2]!, b[3]!) === 'RIFF' &&
    String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

async function fetchImage(url: string): Promise<{ data: Uint8Array; type: string } | null> {
  const got = await safeGet(url, MAX_LOGO_BYTES, 'image/png,image/webp,image/*;q=0.8');
  if (!got) return null;
  const type = sniffImage(got.body);
  // Tiny icons (a 16 px favicon) look poor: at least 400 bytes.
  if (!type || !IMAGE_TYPES.has(type) || got.body.byteLength < 400) return null;
  return { data: got.body, type };
}

// --- Wikidata --------------------------------------------------------------------------------------

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

interface WikidataEntity {
  labels?: Record<string, { value: string }>;
  aliases?: Record<string, Array<{ value: string }>>;
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>>;
}

const claim = (e: WikidataEntity, p: string): string | null => {
  const v = e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value;
  return typeof v === 'string' ? v : null;
};

/** Whether the item's label or one of its aliases is the name (any language, any case). */
export function namedAs(e: WikidataEntity, name: string): boolean {
  const want = fold(name);
  const names = [
    ...Object.values(e.labels ?? {}).map((l) => l.value),
    ...Object.values(e.aliases ?? {}).flatMap((list) => list.map((a) => a.value)),
  ];
  return names.some((n) => fold(n) === want);
}

async function wikidataJson(params: Record<string, string>): Promise<unknown> {
  const got = await safeGet(
    `${WIKIDATA_API}?${new URLSearchParams({ format: 'json', ...params })}`,
    2 * 1024 * 1024,
    'application/json',
  );
  if (!got) return null;
  try {
    return JSON.parse(new TextDecoder().decode(got.body));
  } catch {
    return null;
  }
}

/** The organisation a name stands for: an item named exactly so that has a logo or a website. */
async function wikidataEntity(hints: LogoHints): Promise<WikidataEntity | null> {
  let ids: string[] = [];
  if (hints.wikidata && /^Q\d{1,12}$/.test(hints.wikidata)) {
    ids = [hints.wikidata];
  } else {
    const search = (await wikidataJson({
      action: 'wbsearchentities',
      search: hints.name.slice(0, 80),
      language: 'en',
      uselang: 'en',
      type: 'item',
      limit: '7',
    })) as { search?: Array<{ id: string }> } | null;
    ids = (search?.search ?? []).map((s) => s.id).filter((id) => /^Q\d+$/.test(id));
  }
  if (ids.length === 0) return null;
  const data = (await wikidataJson({
    action: 'wbgetentities',
    ids: ids.join('|'),
    props: 'labels|aliases|claims',
  })) as { entities?: Record<string, WikidataEntity> } | null;
  for (const id of ids) {
    const e = data?.entities?.[id];
    if (!e) continue;
    const useful = claim(e, 'P154') || claim(e, 'P856');
    // An id from OpenStreetMap is trusted; a search result must carry the very name.
    if (useful && (hints.wikidata || namedAs(e, hints.name))) return e;
  }
  return null;
}

// --- Website icons -----------------------------------------------------------------------------

/** The best icon a page offers: the largest apple-touch-icon or icon, as an absolute address. */
export function iconsFromHtml(html: string, base: string): string[] {
  const found: Array<{ href: string; score: number }> = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = /\brel\s*=\s*["']?([^"'>]+)/i.exec(tag)?.[1]?.toLowerCase() ?? '';
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href || !/\b(icon|apple-touch-icon)\b/.test(rel)) continue;
    if (/\.svg(\?|$)/i.test(href) || /mask-icon/.test(rel)) continue;
    const size = Number(/\bsizes\s*=\s*["']?(\d+)x\d+/i.exec(tag)?.[1] ?? 0);
    const score = (rel.includes('apple-touch-icon') ? 180 : 0) + size;
    try {
      found.push({ href: new URL(href, base).href, score });
    } catch {
      // A broken address: skipped.
    }
  }
  return found.sort((a, b) => b.score - a.score).map((f) => f.href);
}

async function websiteIcon(website: string): Promise<{ data: Uint8Array; type: string } | null> {
  let home: URL;
  try {
    home = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    home.protocol = 'https:';
  } catch {
    return null;
  }
  const page = await safeGet(home.href, MAX_PAGE_BYTES, 'text/html');
  const candidates = page ? iconsFromHtml(new TextDecoder().decode(page.body), page.url) : [];
  candidates.push(new URL('/apple-touch-icon.png', home).href, new URL('/favicon.ico', home).href);
  for (const url of candidates.slice(0, 5)) {
    const image = await fetchImage(url);
    if (image) return image;
  }
  return null;
}

/** A logo for a company or store, or null when none is found. */
export async function findLogo(hints: LogoHints): Promise<FoundLogo | null> {
  const entity = await wikidataEntity(hints).catch(() => null);
  const file = entity ? claim(entity, 'P154') : null;
  if (file) {
    const image = await fetchImage(
      `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${LOGO_WIDTH}`,
    );
    if (image) return { ...image, source: 'wikidata' };
  }
  const website = hints.website || (entity ? claim(entity, 'P856') : null);
  if (website) {
    const image = await websiteIcon(website);
    if (image) return { ...image, source: 'website' };
  }
  return null;
}
