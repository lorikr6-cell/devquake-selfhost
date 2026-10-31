// Sample files for the demo organisation: a plain picture (PNG, drawn here, no image library) and
// a one-page PDF. They only show that photos, ID cards and medical papers work; nothing real.

import { deflateSync } from 'node:zlib';

const CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/**
 * A width × height RGB picture: `paint(x, y)` gives each pixel's colour as [r, g, b].
 */
export function demoPng(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number],
): Uint8Array {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y);
      raw[row + 1 + x * 3] = r;
      raw[row + 2 + x * 3] = g;
      raw[row + 3 + x * 3] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', new Uint8Array(0)),
    ]),
  );
}

/** A portrait: a soft background with a head and shoulders. */
export function demoPortrait(size = 160): Uint8Array {
  const c = size / 2;
  return demoPng(size, size, (x, y) => {
    const head = (x - c) ** 2 + (y - size * 0.4) ** 2 < (size * 0.18) ** 2;
    const body = (x - c) ** 2 / (size * 0.32) ** 2 + (y - size) ** 2 / (size * 0.38) ** 2 < 1;
    return head || body ? [120, 136, 150] : [222, 232, 238];
  });
}

/** An ID card: a pale card with a photo square and text lines. */
export function demoIdCard(width = 340, height = 214): Uint8Array {
  return demoPng(width, height, (x, y) => {
    const edge = x < 4 || y < 4 || x >= width - 4 || y >= height - 4;
    const photo = x > 20 && x < 110 && y > 40 && y < 160;
    const line =
      x > 130 && x < width - 24 && [50, 80, 110, 140, 170].some((l) => y >= l && y < l + 8);
    if (edge) return [70, 110, 160];
    if (photo) return [150, 165, 180];
    if (line) return [120, 130, 145];
    return [214, 228, 242];
  });
}

/** A one-page PDF with a title and a few lines (Helvetica, plain ASCII). */
export function demoPdf(title: string, lines: string[]): Uint8Array {
  const esc = (s: string) => s.replace(/[\\()]/g, (m) => `\\${m}`).replace(/[^\x20-\x7e]/g, '?');
  const text = [
    'BT /F1 18 Tf 60 760 Td',
    `(${esc(title)}) Tj`,
    '/F1 11 Tf',
    ...lines.flatMap((l) => ['0 -24 Td', `(${esc(l)}) Tj`]),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(out, 'latin1'));
}
