import { isCountryCode, type AddressParts } from './address';
import { HttpError } from './http';
import { isIsoDate, isIsoMonth } from './dates';
import {
  CURRENCIES,
  PAYMENT_METHODS,
  isCategory,
  type CategoryCode,
  type PaymentMethod,
} from './model';

/**
 * Input validation for the API. Every function throws HttpError(400) with a translation key;
 * `field` arguments are keys of fields.<field> in the translations.
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

/** Multi-line text (comments): line breaks kept, at most 3 empty lines in a row. */
export function longText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') throw bad('required', { field });
  const text = value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  if (!text) throw bad('required', { field });
  if (text.length > max) throw bad('tooLong', { field, max });
  return text;
}

/** Numbers or strings with a comma or dot as decimal separator ("4,50"); null when empty. */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string') return value === undefined || value === null ? null : NaN;
  const text = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!text) return null;
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
}

/** A money amount ≥ 0 with 2 decimals; null when empty. */
export function optionalMoney(value: unknown, field: string): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (Number.isNaN(n) || n < 0 || n > 9_999_999_999) throw bad('amount', { field });
  return Math.round(n * 100) / 100;
}

export function requiredMoney(value: unknown, field: string): number {
  const n = optionalMoney(value, field);
  if (n === null) throw bad('required', { field });
  return n;
}

/** A consumption or meter index ≥ 0 with up to 3 decimals; null when empty. */
export function optionalQuantity(value: unknown, field: string): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (Number.isNaN(n) || n < 0 || n > 99_999_999_999) throw bad('quantity', { field });
  return Math.round(n * 1000) / 1000;
}

/** A unit price > 0 with up to 6 decimals; null when empty. */
export function optionalUnitPrice(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (Number.isNaN(n) || n <= 0 || n > 999_999) throw bad('amount', { field: 'unitPrice' });
  return Math.round(n * 1_000_000) / 1_000_000;
}

export function currency(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'RON';
  if (typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)) return value;
  throw bad('currency');
}

export function categoryCode(value: unknown): CategoryCode {
  if (isCategory(value)) return value;
  throw bad('category');
}

export function paymentMethod(value: unknown): PaymentMethod {
  if (value === undefined || value === null || value === '') return 'cash';
  if ((PAYMENT_METHODS as readonly unknown[]).includes(value)) return value as PaymentMethod;
  throw bad('invalidRequest');
}

export function month(value: unknown): string {
  if (isIsoMonth(value)) return value;
  throw bad('month');
}

export function optionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (isIsoDate(value)) return value;
  throw bad('date', { field });
}

/** A positive integer id, e.g. from a route param. */
export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

export function bool(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'on';
}

export interface ProfileInput {
  fullName: string;
  address: AddressParts;
}

export function profileInput(body: Body): ProfileInput {
  const country = typeof body.countryCode === 'string' ? body.countryCode.toUpperCase() : '';
  if (!isCountryCode(country)) throw bad('country');
  return {
    fullName: requiredText(body.fullName, 'fullName', 120),
    address: {
      countryCode: country,
      state: requiredText(body.state, 'state', 100),
      city: requiredText(body.city, 'city', 100),
      street: requiredText(body.street, 'street', 150),
      houseNumber: requiredText(body.houseNumber, 'houseNumber', 20),
      apartment: optionalText(body.apartment, 'apartment', 40),
    },
  };
}

export interface UtilityInput {
  name: string;
  category: CategoryCode;
  provider: string | null;
  unit: string | null;
  currency: string;
  meterRequired: boolean;
}

export function utilityInput(body: Body): UtilityInput {
  return {
    name: requiredText(body.name, 'utilityName', 80),
    category: categoryCode(body.category),
    provider: optionalText(body.provider, 'provider', 80),
    unit: optionalText(body.unit, 'unit', 12),
    currency: currency(body.currency),
    meterRequired: bool(body.meterRequired),
  };
}

export interface BillInput {
  period: string;
  dueOn: string | null;
  total: number;
  consumption: number | null;
  unitPrice: number | null;
  providerPaid: boolean;
  note: string | null;
}

export function billInput(body: Body): BillInput {
  return {
    period: month(body.period),
    dueOn: optionalDate(body.dueOn, 'dueOn'),
    total: requiredMoney(body.total, 'total'),
    consumption: optionalQuantity(body.consumption, 'consumption'),
    unitPrice: optionalUnitPrice(body.unitPrice),
    providerPaid: bool(body.providerPaid),
    note: optionalText(body.note, 'note', 255),
  };
}

export interface ReadingInput {
  previousIndex: number | null;
  currentIndex: number | null;
  consumption: number;
}

/**
 * A reading: previous and current index (consumption = the difference), or a consumption typed
 * directly when there are no indexes.
 */
export function readingInput(body: Body): ReadingInput {
  const previousIndex = optionalQuantity(body.previousIndex, 'previousIndex');
  const currentIndex = optionalQuantity(body.currentIndex, 'currentIndex');
  if (previousIndex !== null && currentIndex !== null) {
    if (currentIndex < previousIndex) throw bad('indexBelowPrevious');
    return {
      previousIndex,
      currentIndex,
      consumption: Math.round((currentIndex - previousIndex) * 1000) / 1000,
    };
  }
  const consumption = optionalQuantity(body.consumption, 'consumption');
  if (consumption === null) throw bad('readingMissing');
  return { previousIndex, currentIndex, consumption };
}

export interface PaymentInput {
  amount: number;
  method: PaymentMethod;
  receivedOn: string | null;
}

export function paymentInput(body: Body): PaymentInput {
  return {
    amount: requiredMoney(body.amount, 'amountReceived'),
    method: paymentMethod(body.method),
    receivedOn: optionalDate(body.receivedOn, 'receivedOn'),
  };
}
