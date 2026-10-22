import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Personal numbers and documents are encrypted before they are stored, with CANTEEN_MASTER_KEY
// (32 random bytes, base64): AES-256-GCM. Text is "v1.<iv>.<tag>.<data>" in base64url; files are
// the bytes 0x01 | iv (12) | tag (16) | data. Server only. A database copy alone reveals nothing.

const VERSION = 1;

function key(raw: string | undefined = process.env.CANTEEN_MASTER_KEY): Buffer | null {
  if (!raw) return null;
  const k = Buffer.from(raw.trim(), 'base64');
  return k.length === 32 ? k : null;
}

/** Whether personal numbers and documents can be stored (the key is set and valid). */
export const canEncrypt = (raw?: string) => key(raw) !== null;

function required(raw?: string): Buffer {
  const k = key(raw);
  if (!k) throw new Error('CANTEEN_MASTER_KEY is not set (32 random bytes, base64)');
  return k;
}

export function sealBytes(plain: Uint8Array, raw?: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', required(raw), iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([Buffer.from([VERSION]), iv, cipher.getAuthTag(), data]);
}

/** The original bytes, or null when they cannot be read (another key, damaged). */
export function openBytes(sealed: Uint8Array, raw?: string): Buffer | null {
  const k = key(raw);
  const bytes = Buffer.from(sealed);
  if (!k || bytes.length < 29 || bytes[0] !== VERSION) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', k, bytes.subarray(1, 13));
    decipher.setAuthTag(bytes.subarray(13, 29));
    return Buffer.concat([decipher.update(bytes.subarray(29)), decipher.final()]);
  } catch {
    return null;
  }
}

export function sealText(plain: string, raw?: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', required(raw), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv, cipher.getAuthTag(), data]
    .map((p) => (typeof p === 'string' ? p : p.toString('base64url')))
    .join('.');
}

/** The text, or null when it was never set or cannot be read. */
export function openText(sealed: string | null, raw?: string): string | null {
  const k = key(raw);
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
