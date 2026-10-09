// Uploaded files: which ones are accepted (checked by content, not by the file name).

/** Meter photos: shrunk in the browser first, at most 2 MB on the server. */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Provider PDFs: at most 4 MB. */
export const MAX_PDF_BYTES = 4 * 1024 * 1024;

export type PhotoMime = 'image/jpeg' | 'image/png' | 'image/webp';

/** The image type from the first bytes, or null for anything that is not JPEG, PNG or WebP. */
export function sniffPhoto(bytes: Uint8Array): PhotoMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a
  ) {
    return 'image/png';
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** A PDF starts with "%PDF-" (some files have a few bytes of junk before it). */
export function isPdf(bytes: Uint8Array): boolean {
  const head = String.fromCharCode(...bytes.slice(0, 1024));
  return head.includes('%PDF-');
}

/** A safe download name: letters, digits, dots, dashes and underscores; always ".pdf". */
export function safePdfName(name: string | null | undefined): string {
  const base = (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.pdf$/i, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return `${base || 'bill'}.pdf`;
}
