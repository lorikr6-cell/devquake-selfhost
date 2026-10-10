import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// The payment providers' secrets of a store (Stripe secret key and webhook secret, PayPal
// secret), encrypted with STORE_MASTER_KEY (32 random bytes, base64) before they are stored:
// AES-256-GCM, "v1.<iv>.<tag>.<data>" in base64url. Server only (ADR 0057).

function key(raw: string | undefined = process.env.STORE_MASTER_KEY): Buffer | null {
  if (!raw) return null;
  const k = Buffer.from(raw, 'base64');
  return k.length === 32 ? k : null;
}

/** Whether secrets can be stored (STORE_MASTER_KEY is set and valid). */
export const canKeepSecrets = (raw?: string) => key(raw ?? process.env.STORE_MASTER_KEY) !== null;

export function sealSecret(plain: string, raw?: string): string {
  const k = key(raw ?? process.env.STORE_MASTER_KEY);
  if (!k) throw new Error('STORE_MASTER_KEY is not set (32 random bytes, base64)');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', k, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv, tag, data]
    .map((p) => (typeof p === 'string' ? p : p.toString('base64url')))
    .join('.');
}

/** The secret, or null when it was never set or cannot be read (another key). */
export function openSecret(sealed: string | null, raw?: string): string | null {
  const k = key(raw ?? process.env.STORE_MASTER_KEY);
  if (!sealed || !k) return null;
  const [v, iv, tag, data] = sealed.split('.');
  if (v !== 'v1' || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', k, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}
