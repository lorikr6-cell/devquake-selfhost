// Product types and their fields (ADR 0058): what a field can be, how a value is checked and
// stored (always as text), and how it reads in the shop. Pure and tested (fields.test.ts).

export const FIELD_KINDS = [
  'text',
  'textarea',
  'number',
  'boolean',
  'select',
  'multiselect',
  'color',
  'date',
  'url',
] as const;
export type FieldKind = (typeof FIELD_KINDS)[number];
export const isFieldKind = (v: unknown): v is FieldKind => FIELD_KINDS.includes(v as FieldKind);

export const FIELD_LIMITS = {
  typesPerStore: 50,
  fieldsPerType: 40,
  label: 60,
  unit: 20,
  choices: 60,
  choice: 60,
  value: 1000,
  typeName: 60,
} as const;

export interface FieldDef {
  id: number;
  label: string;
  kind: FieldKind;
  unit: string | null;
  choices: string[];
  required: boolean;
  inCompare: boolean;
}

export type FieldProblem = 'number' | 'choice' | 'color' | 'date' | 'url' | 'tooLong' | 'required';

/**
 * A value from the product form as it is stored: '' (empty) when not filled in, else checked
 * text. Multiselect values are stored one per line; booleans as "1" or "0".
 */
export function fieldValue(
  field: FieldDef,
  raw: unknown,
): { ok: true; value: string } | { ok: false; problem: FieldProblem } {
  const list = Array.isArray(raw) ? raw.map((x) => String(x).trim()).filter(Boolean) : null;
  const text = list ? list.join('\n') : raw === undefined || raw === null ? '' : String(raw).trim();
  const empty = field.kind === 'boolean' ? raw === undefined || raw === null || raw === '' : !text;
  if (empty) return field.required ? { ok: false, problem: 'required' } : { ok: true, value: '' };
  if (text.length > FIELD_LIMITS.value) return { ok: false, problem: 'tooLong' };
  switch (field.kind) {
    case 'number': {
      const n = Number(text.replace(',', '.'));
      return Number.isFinite(n) ? { ok: true, value: String(n) } : { ok: false, problem: 'number' };
    }
    case 'boolean':
      return { ok: true, value: raw === true || raw === '1' || raw === 'true' ? '1' : '0' };
    case 'select':
      return field.choices.includes(text)
        ? { ok: true, value: text }
        : { ok: false, problem: 'choice' };
    case 'multiselect': {
      const picked = [...new Set(list ?? text.split('\n').map((x) => x.trim()))].filter(Boolean);
      if (picked.some((x) => !field.choices.includes(x))) return { ok: false, problem: 'choice' };
      // In the order the owner listed the choices.
      return { ok: true, value: field.choices.filter((c) => picked.includes(c)).join('\n') };
    }
    case 'color':
      return /^#[0-9a-fA-F]{6}$/.test(text)
        ? { ok: true, value: text.toLowerCase() }
        : { ok: false, problem: 'color' };
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`))
        ? { ok: true, value: text }
        : { ok: false, problem: 'date' };
    case 'url':
      return /^https?:\/\/\S+$/.test(text)
        ? { ok: true, value: text }
        : { ok: false, problem: 'url' };
    case 'text':
      return { ok: true, value: text.replace(/\s+/g, ' ') };
    case 'textarea':
      return { ok: true, value: text.replace(/\r\n?/g, '\n') };
  }
}

/** The choices typed one per line: trimmed, unique, at most FIELD_LIMITS.choices. */
export function parseChoices(text: unknown): string[] {
  const lines = (Array.isArray(text) ? text : String(text ?? '').split('\n'))
    .map((x) => String(x).replace(/\s+/g, ' ').trim().slice(0, FIELD_LIMITS.choice))
    .filter(Boolean);
  return [...new Set(lines)].slice(0, FIELD_LIMITS.choices);
}

/**
 * A stored value as text for the shop: units added, yes/no and lists in the page language.
 * Colours and links are drawn by the page itself; this gives their text.
 */
export function formatValue(
  field: Pick<FieldDef, 'kind' | 'unit'>,
  value: string,
  words: { yes: string; no: string },
  tag: string,
): string {
  if (!value) return '';
  switch (field.kind) {
    case 'number': {
      const n = Number(value);
      const text = Number.isFinite(n) ? n.toLocaleString(tag) : value;
      return field.unit ? `${text} ${field.unit}` : text;
    }
    case 'boolean':
      return value === '1' ? words.yes : words.no;
    case 'multiselect':
      return value.split('\n').join(', ');
    case 'date': {
      const d = new Date(`${value}T00:00:00Z`);
      return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString(tag, { timeZone: 'UTC', dateStyle: 'medium' });
    }
    default:
      return field.unit ? `${value} ${field.unit}` : value;
  }
}
