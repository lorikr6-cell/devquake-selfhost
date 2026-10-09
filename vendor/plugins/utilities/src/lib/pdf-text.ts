import { extractBillFields, type BillFields } from './pdf-fields';

// Server only: the text layer of a provider's PDF (unpdf, a serverless build of PDF.js), then
// the bill fields from it (pdf-fields.ts). Scanned PDFs have no text layer: every field stays
// empty and the person types the values in.

const MAX_PAGES = 10;

export async function readPdfFields(data: Uint8Array): Promise<BillFields & { text: boolean }> {
  const empty = { total: null, consumption: null, unit: null, unitPrice: null, dueOn: null };
  try {
    const { getDocumentProxy, extractText } = await import('unpdf');
    // PDF.js takes ownership of the buffer: give it a copy.
    const pdf = await getDocumentProxy(new Uint8Array(data));
    if (pdf.numPages > MAX_PAGES) return { ...empty, text: false };
    const { text } = await extractText(pdf, { mergePages: true });
    const content = Array.isArray(text) ? text.join('\n') : text;
    if (!content.trim()) return { ...empty, text: false };
    return { ...extractBillFields(content), text: true };
  } catch {
    // Damaged, encrypted or unusual PDFs: fall back to typing.
    return { ...empty, text: false };
  }
}
