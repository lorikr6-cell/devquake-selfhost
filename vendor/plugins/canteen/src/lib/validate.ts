import { parseCnp } from './cnp';
import { parseTime } from './meals';
import { isIsoDate, type IsoDate } from './dates';
import { HttpError } from './http';
import {
  LIMITS,
  isDiet,
  isPersonKind,
  isStatus,
  type Diet,
  type PersonKind,
  type PersonStatus,
} from './model';

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

/** A day in the URL (YYYY-MM-DD), else 404. */
export function routeDay(value: string | undefined): IsoDate {
  if (!isIsoDate(value)) throw new HttpError(404, 'notFound');
  return value;
}

export function id(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(404, 'notFound');
  return n;
}

/** The earliest year accepted for a date of birth. */
export const BIRTH_FROM_YEAR = 1900;

function optionalBirthDate(value: unknown, field: string): IsoDate | null {
  if (value === undefined || value === null || value === '') return null;
  if (!isIsoDate(value, BIRTH_FROM_YEAR)) throw bad('date', { field });
  return value;
}

/** A UTC timestamp sent by the page (converted from the viewer's zone with localDateTimeToUtc). */
function instant(value: unknown, field: string): Date {
  const date = typeof value === 'string' ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) throw bad('date', { field });
  return date;
}

export function orgInput(body: Body): { name: string } {
  return { name: requiredText(body.name, 'orgName', LIMITS.orgName) };
}

export interface PersonInput {
  firstName: string;
  lastName: string;
  birthDate: IsoDate | null;
  kind: PersonKind;
  status: PersonStatus;
  address: string | null;
  phone: string | null;
  contactName: string | null;
  contactPhone: string | null;
  diet: Diet;
  allergies: string | null;
  observation: string | null;
  /** 1 = Monday … 7 = Sunday; empty for residents (they eat every day). */
  deliveryDays: number[];
  windowFromMin: number | null;
  windowToMin: number | null;
}

/** A delivery window "11:00"–"13:00": both times or none, the end after the start. */
export function deliveryWindow(from: unknown, to: unknown): [number | null, number | null] {
  const empty = (v: unknown) => v === undefined || v === null || v === '';
  if (empty(from) && empty(to)) return [null, null];
  const a = parseTime(from);
  const b = parseTime(to);
  if (a === null || b === null || b <= a) throw bad('deliveryWindow');
  return [a, b];
}

/** The weekdays of a delivery, each once, in order. */
export function weekdays(value: unknown): number[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) {
    throw bad('invalidRequest');
  }
  return [...new Set(value as number[])].sort((a, b) => a - b);
}

export function personInput(body: Body, today: IsoDate): PersonInput {
  const birthDate = optionalBirthDate(body.birthDate, 'birthDate');
  if (birthDate && birthDate > today) throw bad('birthInFuture');
  const kind = body.kind ?? 'delivery';
  if (!isPersonKind(kind)) throw bad('invalidRequest');
  const status = body.status ?? 'active';
  if (!isStatus(status)) throw bad('invalidRequest');
  const diet = body.diet ?? 'normal';
  if (!isDiet(diet)) throw bad('invalidRequest');
  const address = optionalText(body.address, 'address', LIMITS.address);
  if (kind === 'delivery' && !address) throw bad('addressForDelivery');
  return {
    firstName: requiredText(body.firstName, 'firstName', LIMITS.firstName),
    lastName: requiredText(body.lastName, 'lastName', LIMITS.lastName),
    birthDate,
    kind,
    status,
    address,
    phone: optionalText(body.phone, 'phone', LIMITS.phone),
    contactName: optionalText(body.contactName, 'contactName', LIMITS.contactName),
    contactPhone: optionalText(body.contactPhone, 'contactPhone', LIMITS.phone),
    diet,
    allergies: optionalText(body.allergies, 'allergies', LIMITS.allergies),
    observation: longOptionalText(body.observation, 'observation', LIMITS.observation),
    deliveryDays: kind === 'delivery' ? weekdays(body.deliveryDays) : [],
    ...windowOf(kind, body),
  };
}

function windowOf(kind: PersonKind, body: Body) {
  const [windowFromMin, windowToMin] =
    kind === 'delivery' ? deliveryWindow(body.windowFrom, body.windowTo) : [null, null];
  return { windowFromMin, windowToMin };
}

export interface IdentityInput {
  idSeries: string | null;
  idNumber: string | null;
  cnp: string | null;
}

/** The ID card's series (2 letters) and number (6 digits) and the CNP (checksum checked). */
export function identityInput(body: Body): IdentityInput {
  const series = optionalText(body.idSeries, 'idSeries', 4)?.toUpperCase() ?? null;
  if (series && !/^[A-Z]{2}$/.test(series)) throw bad('idSeries');
  const number = optionalText(body.idNumber, 'idNumber', 12)?.replace(/\s/g, '') ?? null;
  if (number && !/^\d{6,9}$/.test(number)) throw bad('idNumber');
  const cnp = optionalText(body.cnp, 'cnp', 20)?.replace(/\s/g, '') ?? null;
  if (cnp && !parseCnp(cnp)) throw bad('cnp');
  return { idSeries: series, idNumber: number, cnp };
}

export function incidentInput(body: Body): { occurredAt: Date; note: string } {
  const note = longOptionalText(body.note, 'note', LIMITS.incident);
  if (!note) throw bad('required', { field: 'note' });
  const occurredAt = instant(body.occurredAt, 'occurredAt');
  if (occurredAt.getTime() > Date.now() + 5 * 60_000) throw bad('incidentInFuture');
  return { occurredAt, note };
}
