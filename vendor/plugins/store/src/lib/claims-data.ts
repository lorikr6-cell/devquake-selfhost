import type { PluginDatabase, PluginLocalizedText } from '@devquake/plugin-sdk';
import {
  CLAIM_MAX_ATTEMPTS,
  claimState,
  newClaimCode,
  newClaimId,
  newClaimToken,
  normalizeCode,
  sha256,
  type ClaimState,
} from './claims';

// Claims and NPS point packages in the store's database (ADR 0079, migration 0006).

type Db = Omit<PluginDatabase, 'transaction'>;

export interface ClaimPackage {
  id: number;
  name: string;
  points: number;
}

export async function listPackages(db: Db, storeId: number): Promise<ClaimPackage[]> {
  const rows = await db.query<{ id: number; name: string; points: number }>(
    'SELECT id, name, points FROM claim_packages WHERE store_id = ? AND archived = 0 ORDER BY points, id',
    [storeId],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, points: Number(r.points) }));
}

export async function createPackage(db: Db, storeId: number, name: string, points: number) {
  await db.execute('INSERT INTO claim_packages (store_id, name, points) VALUES (?, ?, ?)', [
    storeId,
    name,
    points,
  ]);
}

/** Packages are archived, not deleted: claims made from them keep their name and points. */
export async function archivePackage(db: Db, storeId: number, id: number): Promise<boolean> {
  const r = await db.execute(
    'UPDATE claim_packages SET archived = 1 WHERE id = ? AND store_id = ?',
    [id, storeId],
  );
  return r.affectedRows === 1;
}

/** A shop's packages by its address name, for the platform's picker. */
export async function packagesOfShop(
  db: Db,
  slug: string,
): Promise<Array<ClaimPackage & { storeId: number }>> {
  const rows = await db.query<{ id: number; name: string; points: number; store_id: number }>(
    `SELECT p.id, p.name, p.points, p.store_id FROM claim_packages p
       JOIN stores s ON s.id = p.store_id
      WHERE s.slug = ? AND p.archived = 0 ORDER BY p.points, p.id`,
    [slug],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    points: Number(r.points),
    storeId: r.store_id,
  }));
}

export interface ClaimRow {
  id: number;
  public_id: string;
  store_id: number;
  points: number;
  title: string;
  user_id: number;
  reason: string;
  source: string;
  ref: string;
  code_hash: string;
  failed_attempts: number;
  status: 'open' | 'claimed' | 'cancelled';
  expires_at: Date;
  claimed_at: Date | null;
}

const CLAIM_COLUMNS = `id, public_id, store_id, points, title, user_id, reason, source, ref,
  code_hash, failed_attempts, status, expires_at, claimed_at`;

/**
 * A new claim for a package: the token and the code are returned once, in plain text, to be
 * emailed; only their hashes are kept. The same source and ref give the existing claim back
 * (`created: false`, no token or code: nothing is sent twice).
 */
export async function createClaimRow(
  db: Db,
  input: {
    storeId: number;
    packageId: number;
    points: number;
    title: string;
    userId: number;
    reason: PluginLocalizedText;
    source: string;
    ref: string;
    expiresAt: Date;
  },
): Promise<
  { created: true; row: ClaimRow; token: string; code: string } | { created: false; row: ClaimRow }
> {
  const [existing] = await db.query<ClaimRow>(
    `SELECT ${CLAIM_COLUMNS} FROM claims WHERE source = ? AND ref = ?`,
    [input.source, input.ref],
  );
  if (existing) return { created: false, row: existing };
  const token = newClaimToken();
  const code = newClaimCode();
  await db.execute(
    `INSERT INTO claims (public_id, store_id, package_id, points, title, user_id, reason, source,
                         ref, token_hash, code_hash, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newClaimId(),
      input.storeId,
      input.packageId,
      input.points,
      input.title,
      input.userId,
      JSON.stringify(input.reason),
      input.source,
      input.ref,
      sha256(token),
      sha256(code),
      input.expiresAt,
    ],
  );
  const [row] = await db.query<ClaimRow>(
    `SELECT ${CLAIM_COLUMNS} FROM claims WHERE token_hash = ?`,
    [sha256(token)],
  );
  return { created: true, row: row!, token, code };
}

export async function claimsBySource(db: Db, source: string, refs: string[]): Promise<ClaimRow[]> {
  if (!refs.length) return [];
  return db.query<ClaimRow>(`SELECT ${CLAIM_COLUMNS} FROM claims WHERE source = ? AND ref IN (?)`, [
    source,
    refs,
  ]);
}

export async function claimByPublicId(db: Db, publicId: string): Promise<ClaimRow | null> {
  const [row] = await db.query<ClaimRow>(
    `SELECT ${CLAIM_COLUMNS} FROM claims WHERE public_id = ?`,
    [publicId],
  );
  return row ?? null;
}

/** The claim behind a link's token (the hash is looked up; the token itself is never stored). */
export async function claimByToken(db: Db, token: string): Promise<ClaimRow | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await db.query<ClaimRow>(
    `SELECT ${CLAIM_COLUMNS} FROM claims WHERE token_hash = ?`,
    [sha256(token)],
  );
  return row ?? null;
}

export async function cancelClaimRow(db: Db, publicId: string) {
  await db.execute(
    "UPDATE claims SET status = 'cancelled', cancelled_at = UTC_TIMESTAMP() WHERE public_id = ? AND status = 'open'",
    [publicId],
  );
}

/** A new end, and the wrong codes forgotten (staff reopen a locked claim this way). */
export async function extendClaimRow(db: Db, publicId: string, expiresAt: Date) {
  await db.execute(
    "UPDATE claims SET expires_at = ?, failed_attempts = 0 WHERE public_id = ? AND status = 'open'",
    [expiresAt, publicId],
  );
}

/**
 * Checks a typed code. A wrong one counts towards the lock; the right one leaves the claim open
 * for the caller to redeem and then mark claimed.
 */
export async function checkClaimCode(
  db: Db,
  row: ClaimRow,
  typed: string,
  now: Date,
): Promise<{ ok: true } | { ok: false; state: ClaimState | 'wrong'; left?: number }> {
  const state = claimState(row, now);
  if (state !== 'open') return { ok: false, state };
  if (sha256(normalizeCode(typed)) === row.code_hash) return { ok: true };
  await db.execute('UPDATE claims SET failed_attempts = failed_attempts + 1 WHERE id = ?', [
    row.id,
  ]);
  const left = CLAIM_MAX_ATTEMPTS - (row.failed_attempts + 1);
  return left > 0 ? { ok: false, state: 'wrong', left } : { ok: false, state: 'locked' };
}

export async function markClaimed(db: Db, id: number) {
  await db.execute(
    "UPDATE claims SET status = 'claimed', claimed_at = UTC_TIMESTAMP() WHERE id = ? AND status = 'open'",
    [id],
  );
}
