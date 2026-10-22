import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

// A small Excel (.xlsx) writer and reader in pure JS (an .xlsx is a zip of XML files): no
// native modules or worker threads on the server (CLAUDE.md rule 12). Enough for the
// organisation export and its re-upload; tested in xlsx.test.ts.

export type Cell = string | number | null;

export interface Sheet {
  name: string;
  rows: Cell[][];
  /** Rows hidden in Excel (0-based), e.g. the row of column keys. */
  hiddenRows?: number[];
  /** Column widths in characters. */
  widths?: number[];
  /** Rows shown bold (0-based), e.g. the column titles. */
  boldRows?: number[];
}

const esc = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** 0 → "A", 26 → "AA". */
export function columnName(index: number): string {
  let n = index + 1;
  let name = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    name = String.fromCharCode(65 + r) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

/** Sheet names: at most 31 characters, none of []:*?/\ . */
const sheetName = (s: string) => s.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31) || 'Sheet';

function sheetXml(sheet: Sheet): string {
  const hidden = new Set(sheet.hiddenRows ?? []);
  const bold = new Set(sheet.boldRows ?? []);
  const cols = sheet.widths?.length
    ? `<cols>${sheet.widths
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => {
          if (value === null || value === '') return '';
          const ref = `${columnName(c)}${r + 1}`;
          const style = bold.has(r) ? ' s="1"' : ' s="2"';
          if (typeof value === 'number' && Number.isFinite(value)) {
            return `<c r="${ref}"${style}><v>${value}</v></c>`;
          }
          return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(String(value))}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}"${hidden.has(r) ? ' hidden="1"' : ''}>${cells}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rows}</sheetData></worksheet>`;
}

/** The workbook as .xlsx bytes. */
export function writeXlsx(sheets: Sheet[]): Uint8Array {
  const names = sheets.map((s) => sheetName(s.name));
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('')}</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names
      .map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join(
        '',
      )}<Relationship Id="rId${names.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    // Style 1: bold titles; style 2: wrapped text at the top of the cell.
    'xl/styles.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs></styleSheet>`),
  };
  sheets.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s));
  });
  return zipSync(files, { level: 6 });
}

const unesc = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');

/** The text of every <t> inside a fragment (rich text runs joined). */
const texts = (xml: string) =>
  [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unesc(m[1]!)).join('');

/** "C12" → [row 11, column 2]. */
function position(ref: string): [number, number] {
  const m = /^([A-Z]+)(\d+)$/.exec(ref)!;
  let col = 0;
  for (const ch of m[1]!) col = col * 26 + (ch.charCodeAt(0) - 64);
  return [Number(m[2]) - 1, col - 1];
}

/**
 * Reads the sheets of an .xlsx (as Excel, LibreOffice or Google Sheets save it): every cell as
 * text (numbers as Excel stored them). Throws on anything that is not a workbook.
 */
export function readXlsx(
  bytes: Uint8Array,
  /** Bytes one part and all parts may unpack to (smaller in tests). */
  limits = { part: 20 * 1024 * 1024, total: 60 * 1024 * 1024 },
): { name: string; rows: string[][] }[] {
  // A small upload could unpack to gigabytes (a "zip bomb"): cap every part and the total.
  let total = 0;
  const files = unzipSync(bytes, {
    filter: (f) => {
      if (!f.name.startsWith('xl/')) return false;
      total += f.originalSize;
      if (f.originalSize > limits.part || total > limits.total) {
        throw new Error('workbook too large');
      }
      return true;
    },
  });
  const read = (path: string) => (files[path] ? strFromU8(files[path]!) : null);
  const workbook = read('xl/workbook.xml');
  const rels = read('xl/_rels/workbook.xml.rels');
  if (!workbook || !rels) throw new Error('not a workbook');
  const shared = [...(read('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(
    (m) => texts(m[1]!),
  );
  const targets = new Map(
    [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => {
      const id = /Id="([^"]+)"/.exec(m[0])?.[1] ?? '';
      const target = /Target="([^"]+)"/.exec(m[0])?.[1] ?? '';
      return [id, target.replace(/^\/?(xl\/)?/, 'xl/')];
    }),
  );
  return [...workbook.matchAll(/<sheet\b[^>]*>/g)].map((m) => {
    const name = unesc(/name="([^"]*)"/.exec(m[0])?.[1] ?? '');
    const rid = /r:id="([^"]+)"/.exec(m[0])?.[1] ?? '';
    const xml = read(targets.get(rid) ?? '') ?? '';
    const rows: string[][] = [];
    for (const c of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1]!;
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      if (!ref) continue;
      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      const inner = c[2] ?? '';
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let value = '';
      if (type === 's') value = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') value = texts(inner);
      else if (v !== undefined) value = unesc(v);
      const [r, col] = position(ref);
      (rows[r] ??= [])[col] = value;
    }
    return { name, rows: Array.from(rows, (row) => Array.from(row ?? [], (v) => v ?? '')) };
  });
}
