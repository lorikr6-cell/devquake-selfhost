import { HttpError } from './http';
import { isIsoDate } from './dates';
import { CURRENCIES } from './model';
import { guessStoreType, isStoreType } from './store-types';

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

/** Accepts numbers or strings with a comma or dot as decimal separator ("4,50"). */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string') return value === undefined || value === null ? null : NaN;
  const text = value.trim().replace(',', '.');
  if (!text) return null;
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
}

/** Optional quantity: empty = none (the product is just "1 × unit"). */
export function quantity(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (Number.isNaN(n) || n <= 0 || n > 99_999) throw bad('quantity');
  return Math.round(n * 1000) / 1000;
}

export function price(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (Number.isNaN(n) || n < 0 || n > 9_999_999) throw bad('price');
  return Math.round(n * 100) / 100;
}

export function currency(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'RON';
  if (typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)) return value;
  throw bad('currency');
}

/** The day a list is planned for ("YYYY-MM-DD"). */
export function shopDate(value: unknown): string {
  if (isIsoDate(value)) return value;
  throw bad('date');
}

/** A positive integer id, e.g. from a route param. */
export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

/** Optional store reference: null/""/undefined = no store. */
export function storeRef(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  return id(value);
}

export interface StoreInput {
  name: string;
  type: string;
  location: string | null;
  description: string | null;
  /** From OpenStreetMap, to find the logo (ADR 0052); never stored with the store. */
  brand: { name: string | null; wikidata: string | null; website: string | null };
}

/** Store fields; the type is filled in from the name ("Kaufland" → grocery) when not given. */
export function storeInput(body: Body): StoreInput {
  const name = requiredText(body.name, 'storeName', 80);
  let type: string;
  if (body.type === undefined || body.type === null || body.type === '') {
    type = guessStoreType(name) ?? 'other';
  } else if (isStoreType(body.type)) {
    type = body.type;
  } else {
    throw bad('storeType');
  }
  return {
    name,
    type,
    location: optionalText(body.location, 'location', 160),
    description: optionalText(body.description, 'storeDescription', 255),
    brand: {
      name: optionalText(body.brand, 'storeName', 80),
      wikidata:
        typeof body.wikidata === 'string' && /^Q\d{1,12}$/.test(body.wikidata)
          ? body.wikidata
          : null,
      website:
        typeof body.website === 'string' && /^https?:\/\/\S{3,250}$/i.test(body.website)
          ? body.website
          : null,
    },
  };
}

export interface ItemInput {
  name: string;
  quantity: number | null;
  unit: string;
  price: number | null;
  description: string | null;
  storeId: number | null;
}

export function itemInput(body: Body): ItemInput {
  return {
    name: requiredText(body.name, 'itemName', 120),
    quantity: quantity(body.quantity),
    unit: requiredText(body.unit, 'unit', 16),
    price: price(body.price),
    description: optionalText(body.description, 'description', 255),
    storeId: storeRef(body.storeId),
  };
}
