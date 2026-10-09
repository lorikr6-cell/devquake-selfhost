import { describe, expect, it } from 'vitest';
import { readPdfFields } from './pdf-text';

/** A tiny one-page PDF with the given lines of text (valid xref, Helvetica). */
function makePdf(lines: string[]): Uint8Array {
  const escape = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const content = [
    'BT /F1 12 Tf 14 TL 50 780 Td',
    ...lines.map((l) => `(${escape(l)}) '`),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

describe('readPdfFields', () => {
  it('reads the fields from a real PDF text layer', async () => {
    const fields = await readPdfFields(
      makePdf([
        'Energie activa  Cantitate 245,000 kWh',
        'Pret unitar 0,8734 lei/kWh',
        'Total de plata: 254,63 lei',
        'Data scadenta: 25.09.2026',
      ]),
    );
    expect(fields).toEqual({
      total: 254.63,
      consumption: 245,
      unit: 'kWh',
      unitPrice: 0.8734,
      dueOn: '2026-09-25',
      text: true,
    });
  });

  it('returns empty fields for a broken file', async () => {
    const fields = await readPdfFields(new TextEncoder().encode('%PDF-1.4 broken'));
    expect(fields.text).toBe(false);
    expect(fields.total).toBeNull();
  });
});
