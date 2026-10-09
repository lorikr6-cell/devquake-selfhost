// Reads the total, consumption, unit price and due date from the text of a provider's PDF bill.
// Pure (the PDF → text step is in pdf-text.ts), unit-tested with Romanian, German, Hungarian and
// English wording. It is a best effort: whatever it cannot find stays empty and the person types
// it in the same form.

export interface BillFields {
  total: number | null;
  consumption: number | null;
  unit: string | null;
  unitPrice: number | null;
  /** "YYYY-MM-DD" */
  dueOn: string | null;
}

/** Lower case, no diacritics, single spaces ("Total de plată" → "total de plata"). */
function normalize(line: string): string {
  return line
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ș|ş/g, 's')
    .replace(/ț|ţ/g, 't')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Number-like tokens: "1.234,56", "1 234,56", "1,234.56", "245", "0,8734".
const NUMBER = /-?\d{1,3}(?:[ .,\u00a0\u202f]\d{3})+(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?/g;

export type DecimalSeparator = ',' | '.';

/**
 * A number written with either decimal separator and optional thousands separators. A single
 * separator followed by exactly three digits ("1.234", "245,000") is ambiguous: it is a decimal
 * separator when it is the document's decimal separator (`decimal`), otherwise thousands.
 */
export function parseLocaleNumber(raw: string, decimal?: DecimalSeparator): number | null {
  let text = raw.replace(/[\s\u00a0\u202f]/g, '');
  if (!/^-?[\d.,]+$/.test(text)) return null;
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // Both: the later one is the decimal separator.
    text = lastComma > lastDot ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.';
    const count = text.split(sep).length - 1;
    const decimals = text.length - text.lastIndexOf(sep) - 1;
    const thousands = count > 1 || (decimals === 3 && sep !== decimal);
    text = thousands ? text.split(sep).join('') : text.replace(sep, '.');
  }
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** The separator the document uses before two-decimal amounts ("254,63" → ","). */
export function detectDecimalSeparator(text: string): DecimalSeparator | undefined {
  // Dates ("05.09.2026", "2026.10.10") look like amounts; leave them out.
  const plain = text.replace(/\d{1,4}[./-]\d{1,2}[./-]\d{1,4}/g, ' ');
  const comma = (plain.match(/\d,\d{2}(?!\d)/g) ?? []).length;
  const dot = (plain.match(/\d\.\d{2}(?!\d)/g) ?? []).length;
  if (comma === dot) return undefined;
  return comma > dot ? ',' : '.';
}

function numbersIn(
  line: string,
  decimal: DecimalSeparator | undefined,
): { raw: string; value: number; index: number }[] {
  const found: { raw: string; value: number; index: number }[] = [];
  for (const m of line.matchAll(NUMBER)) {
    const value = parseLocaleNumber(m[0], decimal);
    if (value !== null) found.push({ raw: m[0], value, index: m.index ?? 0 });
  }
  return found;
}

const isDateLike = (line: string, index: number, raw: string) => {
  const around = line.slice(Math.max(0, index - 1), index + raw.length + 6);
  return /\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(around);
};

// Highest priority first. Lines are normalized (no diacritics, lower case).
const TOTAL_KEYS: RegExp[] = [
  /total de plata|suma de plata|total factura curenta|total factura|rest de plata/,
  /total amount due|amount due|total due|total to pay|balance due|amount payable/,
  /zu zahlender betrag|zahlbetrag|rechnungsbetrag|gesamtbetrag|endbetrag|zu zahlen/,
  /fizetendo osszeg|fizetendo vegosszeg|szamla vegosszege|vegosszeg|fizetendo/,
  /\btotal\b|\bsumme\b|\bosszesen\b/,
];

const CONSUMPTION_KEYS =
  /consum|cantitate|consumption|usage|verbrauch|menge|fogyasztas|mennyiseg|energie activa/;

const UNIT_PRICE_KEYS =
  /pret unitar|pretul unitar|unit price|price per|rate per|arbeitspreis|preis je|preis pro|egysegar/;

const DUE_KEYS =
  /scaden|data limita|due date|pay by|payment due|fallig|zahlbar bis|fizetesi hatarido|esedekesseg/;

// Units written after a consumption: kWh, MWh, m³ / m3 / mc (metri cubi), Gcal.
const UNIT_AFTER = /^\s*(kwh|mwh|m3|m³|mc|gcal)(?![a-z0-9])/i;

const CURRENCY_NEAR = /(lei|ron|eur|€|huf|ft|usd|\$|gbp|£)/i;

function unitLabel(raw: string): string {
  const u = raw.toLowerCase();
  if (u === 'kwh') return 'kWh';
  if (u === 'mwh') return 'MWh';
  if (u === 'gcal') return 'Gcal';
  return 'm³';
}

function findTotal(lines: string[], decimal: DecimalSeparator | undefined): number | null {
  for (const key of TOTAL_KEYS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const match = key.exec(line);
      if (!match) continue;
      // The amount is after the label on the same line, or on the next line.
      const after = line.slice(match.index + match[0].length);
      const candidates = [after, lines[i + 1] ?? ''];
      for (const text of candidates) {
        const amounts = numbersIn(text, decimal).filter(
          (n) => n.value > 0 && !isDateLike(text, n.index, n.raw),
        );
        // Prefer a number with a currency next to it, then one with two decimals.
        const withCurrency = amounts.find(
          (n) =>
            CURRENCY_NEAR.test(text.slice(n.index + n.raw.length, n.index + n.raw.length + 5)) ||
            CURRENCY_NEAR.test(text.slice(Math.max(0, n.index - 5), n.index)),
        );
        const twoDecimals = amounts.find((n) => /[.,]\d{2}$/.test(n.raw));
        const pick = withCurrency ?? twoDecimals ?? amounts[amounts.length - 1];
        if (pick) return Math.round(pick.value * 100) / 100;
      }
    }
  }
  return null;
}

function consumptionOn(
  line: string,
  decimal: DecimalSeparator | undefined,
): { value: number; unit: string } | null {
  for (const n of numbersIn(line, decimal)) {
    const rest = line.slice(n.index + n.raw.length);
    const unit = UNIT_AFTER.exec(rest);
    // "/kWh" right after a number is a price, not a consumption.
    if (unit && n.value > 0 && !/^\s*\//.test(rest)) {
      const value = unit[1]!.toLowerCase() === 'mwh' ? n.value * 1000 : n.value;
      return { value, unit: unit[1]!.toLowerCase() === 'mwh' ? 'kWh' : unitLabel(unit[1]!) };
    }
  }
  return null;
}

function findConsumption(
  lines: string[],
  decimal: DecimalSeparator | undefined,
): { value: number; unit: string } | null {
  for (const line of lines) {
    if (CONSUMPTION_KEYS.test(line)) {
      const found = consumptionOn(line, decimal);
      if (found) return found;
    }
  }
  // Otherwise the value that appears most often with a unit.
  const counts = new Map<string, { value: number; unit: string; count: number }>();
  for (const line of lines) {
    const found = consumptionOn(line, decimal);
    if (!found) continue;
    const key = `${found.value}${found.unit}`;
    const entry = counts.get(key) ?? { ...found, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  const best = [...counts.values()].sort((a, b) => b.count - a.count || b.value - a.value)[0];
  return best ? { value: best.value, unit: best.unit } : null;
}

function findUnitPrice(lines: string[], decimal: DecimalSeparator | undefined): number | null {
  // "0,8734 lei/kWh", "0.25 €/kWh", "28,5 ct/kWh"
  const perUnit =
    /(-?\d+(?:[.,]\d+)?)\s*(lei|ron|eur|€|ft|huf|ct|cent|bani)?\s*\/\s*(kwh|m3|m³|mc|gcal)/i;
  for (const line of lines) {
    const m = perUnit.exec(line);
    if (!m) continue;
    const value = parseLocaleNumber(m[1]!, decimal);
    if (value === null || value <= 0) continue;
    const minor = /^(ct|cent|bani)$/i.test(m[2] ?? '');
    return minor ? value / 100 : value;
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const key = UNIT_PRICE_KEYS.exec(line);
    if (!key) continue;
    const after = line.slice(key.index + key[0].length);
    const value = numbersIn(after, decimal).find((n) => n.value > 0 && n.value < 1000);
    if (value) return value.value;
  }
  return null;
}

const pad = (n: number) => String(n).padStart(2, '0');

function dateIn(line: string): string | null {
  const iso = /(\d{4})[./-](\d{1,2})[./-](\d{1,2})/.exec(line);
  const eu = /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(line);
  let y: number, m: number, d: number;
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (eu) [y, m, d] = [Number(eu[3]), Number(eu[2]), Number(eu[1])];
  else return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

function findDueDate(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const key = DUE_KEYS.exec(line);
    if (!key) continue;
    const found = dateIn(line.slice(key.index)) ?? dateIn(lines[i + 1] ?? '');
    if (found) return found;
  }
  return null;
}

export function extractBillFields(text: string): BillFields {
  const lines = text
    .split(/\r?\n/)
    .map(normalize)
    .filter((l) => l.length > 0);
  const decimal = detectDecimalSeparator(text);
  const consumption = findConsumption(lines, decimal);
  let unitPrice = findUnitPrice(lines, decimal);
  const total = findTotal(lines, decimal);
  if (unitPrice !== null) unitPrice = Math.round(unitPrice * 1_000_000) / 1_000_000;
  return {
    total,
    consumption: consumption ? Math.round(consumption.value * 1000) / 1000 : null,
    unit: consumption?.unit ?? null,
    unitPrice,
    dueOn: findDueDate(lines),
  };
}

/** Whether anything useful was read (otherwise the person fills in the form by hand). */
export function hasAnyField(fields: BillFields): boolean {
  return fields.total !== null || fields.consumption !== null || fields.unitPrice !== null;
}
