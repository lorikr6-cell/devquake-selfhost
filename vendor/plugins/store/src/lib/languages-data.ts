import type { PluginDatabase } from '@devquake/plugin-sdk';
import type { Messages } from '@devquake/ui';
import { HttpError } from './http';
import { LANGUAGE_LIMITS, countLabels } from './store-i18n';

// The shop's own languages (ADR 0058), stored as JSON per store and code. SQL with ?
// placeholders only.

type Db = Omit<PluginDatabase, 'transaction'>;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : '');

export interface StoreLanguage {
  code: string;
  name: string;
  labels: number;
  updatedAt: string;
}

function parse(text: string): Messages {
  try {
    const v = JSON.parse(text) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Messages) : {};
  } catch {
    return {};
  }
}

export async function listLanguages(db: Db, storeId: number): Promise<StoreLanguage[]> {
  const rows = await db.query<{ code: string; name: string; messages: string; updated_at: Date }>(
    'SELECT code, name, messages, updated_at FROM store_languages WHERE store_id = ? ORDER BY name',
    [storeId],
  );
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    labels: countLabels(parse(r.messages)),
    updatedAt: iso(r.updated_at),
  }));
}

/** The codes and names buyers can pick (no labels). */
export async function languageNames(
  db: Db,
  storeId: number,
): Promise<Array<{ code: string; name: string }>> {
  return db.query<{ code: string; name: string }>(
    'SELECT code, name FROM store_languages WHERE store_id = ? ORDER BY name',
    [storeId],
  );
}

export async function languageMessages(
  db: Db,
  storeId: number,
  code: string,
): Promise<Messages | null> {
  const [r] = await db.query<{ messages: string }>(
    'SELECT messages FROM store_languages WHERE store_id = ? AND code = ?',
    [storeId, code],
  );
  return r ? parse(r.messages) : null;
}

export async function saveLanguage(
  db: Db,
  storeId: number,
  input: { code: string; name: string; messages: Messages },
): Promise<void> {
  const json = JSON.stringify(input.messages);
  if (json.length > LANGUAGE_LIMITS.bytes) throw new HttpError(413, 'tooLarge');
  const existing = await languageNames(db, storeId);
  if (existing.length >= LANGUAGE_LIMITS.languages && !existing.some((l) => l.code === input.code))
    throw new HttpError(409, 'tooManyLanguages', { max: LANGUAGE_LIMITS.languages });
  await db.execute(
    `INSERT INTO store_languages (store_id, code, name, messages) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), messages = VALUES(messages)`,
    [storeId, input.code, input.name, json],
  );
}

export async function deleteLanguage(db: Db, storeId: number, code: string): Promise<void> {
  const res = await db.execute('DELETE FROM store_languages WHERE store_id = ? AND code = ?', [
    storeId,
    code,
  ]);
  if (res.affectedRows === 0) throw new HttpError(404, 'notFound');
  await db.execute(
    'UPDATE stores SET default_language = NULL WHERE id = ? AND default_language = ?',
    [storeId, code],
  );
}

/** The language buyers see first: one of the shop's own, or null for the visitor's language. */
export async function setDefaultLanguage(db: Db, storeId: number, code: string | null) {
  if (code !== null && !(await languageNames(db, storeId)).some((l) => l.code === code))
    throw new HttpError(404, 'notFound');
  await db.execute('UPDATE stores SET default_language = ? WHERE id = ?', [code, storeId]);
}
