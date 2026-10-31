import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { demoIdCard, demoPdf, demoPortrait } from './demo-files';
import { sniffPhoto } from './files';

describe('demo files', () => {
  it('draws real PNGs the upload check accepts', () => {
    for (const png of [demoPortrait(), demoPortrait(64), demoIdCard()]) {
      expect(sniffPhoto(png)).toBe('image/png');
      // IDAT inflates to (width * 3 + 1) * height bytes.
      const buf = Buffer.from(png);
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      const at = buf.indexOf('IDAT');
      const len = buf.readUInt32BE(at - 4);
      expect(inflateSync(buf.subarray(at + 4, at + 4 + len))).toHaveLength(
        (width * 3 + 1) * height,
      );
    }
  });

  it('writes a one-page PDF with its cross-reference table', () => {
    const pdf = Buffer.from(demoPdf('Title (x)', ['line']));
    const text = pdf.toString('latin1');
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain(String.raw`(Title \(x\)) Tj`);
    const xref = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(xref, xref + 4)).toBe('xref');
  });
});
