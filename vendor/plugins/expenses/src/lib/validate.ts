import { isIsoDate, type IsoDate } from './dates';
import { HttpError } from './http';
import {
  LIMITS,
  isCategory,
  isCurrency,
  isGroupKind,
  isSplitMode,
  parseAmount,
  type Category,
  type GroupKind,
} from './model';
import type { SplitEntry, SplitMode } from './split';

/**
 * Checks request bodies. Errors are HttpError(400, key, params): `key` is errors.<key> in the
 * translations, a `field` param names fields.<field> (ADR 0011).
 */

export type Body = Record<string, unknown>;

export async function readBody(request: Request): Promise<Body> {
  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'invalidRequest');
  }
  return data as Body;
}

const bad = (key: string, params?: Record<string, string | number>) =>
  new HttpError(400, key, params);

/** Trimmed text with whitespace collapsed; null when empty. */
export function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw bad('mustBeText', { field });
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length > max) throw bad('tooLong', { field, max });
  return text;
}

export function requiredText(value: unknown, field: string, max: number): string {
  const text = optionalText(value, field, max);
  if (!text) throw bad('required', { field });
  return text;
}

/** Multi-line text: line breaks kept (at most two empty lines in a row); null when empty. */
export function longOptionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw bad('mustBeText', { field });
  const text = value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  if (!text) return null;
  if (text.length > max) throw bad('tooLong', { field, max });
  return text;
}

export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

export function day(value: unknown, field: string): IsoDate {
  if (!isIsoDate(value)) throw bad('date', { field });
  return value;
}

export function amount(value: unknown, field = 'amount'): number {
  const n = parseAmount(value);
  if (n === null) throw bad('amount', { field, max: LIMITS.amount });
  return n;
}

export interface GroupInput {
  name: string;
  kind: GroupKind;
  currency: string;
}

export function groupInput(body: Body): GroupInput {
  const kind = body.kind ?? 'other';
  if (!isGroupKind(kind)) throw bad('groupKind');
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';
  if (!isCurrency(currency)) throw bad('currency');
  return { name: requiredText(body.name, 'groupName', LIMITS.groupName), kind, currency };
}

export interface ExpenseInput {
  title: string;
  amount: number;
  paidBy: number;
  splitMode: SplitMode;
  entries: SplitEntry[];
  category: Category;
  spentOn: IsoDate;
  note: string | null;
}

export function expenseInput(body: Body): ExpenseInput {
  const splitMode = body.splitMode ?? 'equal';
  if (!isSplitMode(splitMode)) throw bad('splitMode');
  const category = body.category ?? 'other';
  if (!isCategory(category)) throw bad('category');
  if (!Array.isArray(body.entries) || body.entries.length === 0) throw bad('noParticipants');
  if (body.entries.length > LIMITS.membersPerGroup) throw bad('invalidRequest');
  const seen = new Set<number>();
  const entries = body.entries.map((raw): SplitEntry => {
    const e = (raw ?? {}) as Body;
    const memberId = id(e.memberId);
    if (seen.has(memberId)) throw bad('invalidRequest');
    seen.add(memberId);
    if (splitMode === 'equal') return { memberId, value: 1 };
    const text = typeof e.value === 'number' ? String(e.value) : String(e.value ?? '');
    const value = Number(text.trim().replace(',', '.'));
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) throw bad('splitValue');
    return { memberId, value };
  });
  return {
    title: requiredText(body.title, 'title', LIMITS.title),
    amount: amount(body.amount),
    paidBy: id(body.paidBy),
    splitMode,
    entries,
    category,
    spentOn: day(body.spentOn, 'spentOn'),
    note: longOptionalText(body.note, 'note', LIMITS.note),
  };
}

export interface PaymentInput {
  from: number;
  to: number;
  amount: number;
  paidOn: IsoDate;
  note: string | null;
}

export function paymentInput(body: Body): PaymentInput {
  const input = {
    from: id(body.from),
    to: id(body.to),
    amount: amount(body.amount),
    paidOn: day(body.paidOn, 'paidOn'),
    note: optionalText(body.note, 'note', LIMITS.paymentNote),
  };
  if (input.from === input.to) throw bad('samePerson');
  return input;
}
