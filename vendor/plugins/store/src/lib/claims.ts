// Claims (ADR 0079): something a DevQuake member may take for free, made when the platform asks
// (e.g. a challenge prize). For now a claim gives an NPS point package; shipped products come
// later. The claim link's token and the secret code are random and stored only as SHA-256
// hashes; five wrong codes lock a claim; it expires (90 days by default). Pure and tested.

import { createHash, randomBytes, randomInt } from 'node:crypto';

/** Wrong codes after which a claim is locked until staff extend it. */
export const CLAIM_MAX_ATTEMPTS = 5;
export const CLAIM_CODE_LENGTH = 8;
/** An NPS point package gives 1 to this many points. */
export const PACKAGE_POINTS_MAX = 100;
export const PACKAGE_NAME_MAX = 120;

/** Letters and digits that cannot be mistaken for each other when typed from an email. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const newClaimToken = () => randomBytes(32).toString('base64url');
export const newClaimId = () => randomBytes(9).toString('base64url');
export function newClaimCode(): string {
  let code = '';
  for (let i = 0; i < CLAIM_CODE_LENGTH; i += 1)
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** The code as typed: spaces and dashes dropped, upper case. */
export const normalizeCode = (typed: string) => typed.replace(/[\s-]+/g, '').toUpperCase();

/** A claimable thing's reference: "nps:<package id>" for an NPS point package. */
export function parseClaimProduct(product: string): { kind: 'nps'; id: number } | null {
  const m = /^nps:(\d{1,9})$/.exec(product);
  return m ? { kind: 'nps', id: Number(m[1]) } : null;
}

export type ClaimState = 'open' | 'claimed' | 'expired' | 'locked' | 'cancelled';

/** Where a claim stands now, from what is stored. */
export function claimState(
  row: { status: 'open' | 'claimed' | 'cancelled'; failed_attempts: number; expires_at: Date },
  now: Date,
): ClaimState {
  if (row.status !== 'open') return row.status;
  if (row.failed_attempts >= CLAIM_MAX_ATTEMPTS) return 'locked';
  if (now >= row.expires_at) return 'expired';
  return 'open';
}

/** An NPS package's name and points as typed by the shop owner, or why not. */
export function checkPackage(raw: {
  name?: unknown;
  points?: unknown;
}): { ok: true; name: string; points: number } | { ok: false; error: 'name' | 'points' } {
  const name = String(raw.name ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > PACKAGE_NAME_MAX) return { ok: false, error: 'name' };
  const points = Number(raw.points);
  if (!Number.isInteger(points) || points < 1 || points > PACKAGE_POINTS_MAX)
    return { ok: false, error: 'points' };
  return { ok: true, name, points };
}
