import { describe, expect, it } from 'vitest';
import { isPdf, safePdfName, sniffPhoto } from './files';

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);

describe('files', () => {
  it('recognises photos by content', () => {
    expect(sniffPhoto(bytes(0xff, 0xd8, 0xff))).toBe('image/jpeg');
    expect(sniffPhoto(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))).toBe('image/png');
    expect(sniffPhoto(new TextEncoder().encode('RIFF1234WEBPVP8 '))).toBe('image/webp');
    expect(sniffPhoto(new TextEncoder().encode('%PDF-1.7 hello world'))).toBeNull();
  });

  it('recognises PDFs by content', () => {
    expect(isPdf(new TextEncoder().encode('%PDF-1.7\n...'))).toBe(true);
    expect(isPdf(new TextEncoder().encode('<html>'))).toBe(false);
  });

  it('makes safe download names', () => {
    expect(safePdfName('Factură Enel august.pdf')).toBe('Factura-Enel-august.pdf');
    expect(safePdfName('../../etc/passwd')).toBe('..-..-etc-passwd.pdf');
    expect(safePdfName(null)).toBe('bill.pdf');
  });
});
