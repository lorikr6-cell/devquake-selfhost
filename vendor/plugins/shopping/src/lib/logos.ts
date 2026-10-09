import type { PluginDatabase } from '@devquake/plugin-sdk';
import { HttpError } from './http';
import { findLogo, logoKey, type LogoHints } from './logo-finder';

// Store logos (ADR 0052): looked up once per store name in the background after a store is
// added (or when a list shows a store whose name was never looked up), kept in brand_logos and
// shared by every list. A name without a logo is asked again after RETRY_DAYS.

type Db = Omit<PluginDatabase, 'transaction'>;

const RETRY_DAYS = 30;
/** Lookups per server process and minute: Wikidata and Commons are shared, free services. */
const PER_MINUTE = 20;
const running = new Set<string>();
let window = { start: 0, count: 0 };

/** The address of a stored logo. */
export const logoUrl = (key: string) => `/api/logos/${key}`;

/** Which of these store names have a logo (by name), and which were never looked up. */
export async function logoState(db: Db, names: string[]) {
  const keys = [...new Set(names.map(logoKey).filter(Boolean))];
  const found = new Map<string, string>();
  const unknown = new Set(keys);
  if (keys.length === 0) return { found, unknown };
  try {
    const rows = await db.query<{ name_key: string; found: number; checked_at: Date | string }>(
      `SELECT name_key, found, checked_at FROM brand_logos WHERE name_key IN (${keys.map(() => '?').join(',')})`,
      keys,
    );
    for (const r of rows) {
      const age = Date.now() - new Date(r.checked_at).getTime();
      if (Number(r.found) === 1) found.set(r.name_key, logoUrl(r.name_key));
      if (Number(r.found) === 1 || age < RETRY_DAYS * 86_400_000) unknown.delete(r.name_key);
    }
  } catch {
    // Before migration 0009: no logos, nothing to look up.
    unknown.clear();
  }
  return { found, unknown };
}

/**
 * Looks a store's logo up in the background, once per name at a time and within the rate limit,
 * and stores what was found (or that nothing was). `onFound` runs when a logo was stored.
 */
export function ensureLogo(db: Db, hints: LogoHints, onFound?: () => Promise<unknown>): void {
  const key = logoKey(hints.name);
  if (!key || running.has(key)) return;
  const now = Date.now();
  if (now - window.start > 60_000) window = { start: now, count: 0 };
  if (window.count >= PER_MINUTE) return;
  window.count++;
  running.add(key);
  void (async () => {
    try {
      const [row] = await db.query<{ found: number; checked_at: Date | string }>(
        'SELECT found, checked_at FROM brand_logos WHERE name_key = ?',
        [key],
      );
      if (
        row &&
        (Number(row.found) === 1 ||
          Date.now() - new Date(row.checked_at).getTime() < RETRY_DAYS * 86_400_000)
      ) {
        return;
      }
      const logo = await findLogo(hints);
      await db.execute(
        `INSERT INTO brand_logos (name_key, found, data, content_type, source, checked_at)
         VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE found = VALUES(found), data = VALUES(data),
           content_type = VALUES(content_type), source = VALUES(source), checked_at = VALUES(checked_at)`,
        [
          key,
          logo ? 1 : 0,
          logo ? Buffer.from(logo.data) : null,
          logo?.type ?? null,
          logo?.source ?? null,
        ],
      );
      if (logo && onFound) await onFound();
    } catch (err) {
      console.error(`[shopping] logo lookup for "${key}" failed`, (err as Error).message);
    } finally {
      running.delete(key);
    }
  })();
}

export async function readLogo(db: Db, key: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(key)) throw new HttpError(404, 'notFound');
  const [row] = await db.query<{ data: Buffer; content_type: string }>(
    'SELECT data, content_type FROM brand_logos WHERE name_key = ? AND found = 1',
    [key],
  );
  if (!row?.data) throw new HttpError(404, 'notFound');
  return row;
}
