import { localDateTimeToUtc } from '@devquake/ui';
import type {
  Buyer,
  LegalInput,
  PaymentsInput,
  ProductInput,
  StoreInput,
  VariantInput,
} from './data';
import { HttpError } from './http';
import {
  LIMITS,
  SLUG,
  cleanIban,
  isCarrier,
  isCountry,
  isCurrency,
  isEmail,
  isPaymentMethod,
  slugify,
  type CarrierCode,
  type PaymentMethod,
} from './model';
import { parseCents, type Zone } from './pricing';
import { MESSAGE_LIMITS } from './buyers-data-limits';
import type { BuyerDetails } from './buyers-data';
import type { FieldInput, VendorInput } from './catalog-data';
import { FIELD_LIMITS, fieldValue, isFieldKind, parseChoices, type FieldDef } from './fields';
import {
  ANNOUNCEMENT_PLACEMENTS,
  ANNOUNCEMENT_TONES,
  CAMPAIGN_SCOPES,
  VOUCHER_CODE,
  VOUCHER_KINDS,
  normalizeCode,
} from './marketing';
import {
  MARKETING_LIMITS,
  type AnnouncementInput,
  type CampaignInput,
  type VoucherInput,
} from './marketing-data';
import { NEWSLETTER_LIMITS, NEWSLETTER_SECTIONS, type NewsletterInput } from './newsletter-data';
import { REVIEW_LIMITS } from './reviews';
import { parseRoles, type StaffRole } from './roles';
import { RULE_KINDS } from './rules';
import type { RuleInput } from './marketing-data';
import { SEO_LIMITS, isGtin } from './seo';

/**
 * Checks request bodies. Errors are HttpError(400, key, params): `key` is errors.<key> in the
 * translations, a `field` param names fields.<field> (ADR 0011).
 */

export type Body = Record<string, unknown>;

export async function readBody(request: Request, maxBytes = 256 * 1024): Promise<Body> {
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes)
    throw new HttpError(413, 'tooLarge');
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

const bool = (v: unknown) => v === true;

export function cents(value: unknown, field: string): number {
  const n = parseCents(value);
  if (n === null) throw bad('amount', { field });
  return n;
}

function optionalCents(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === '') return null;
  return cents(value, field);
}

function vatRate(value: unknown, field = 'vatRate'): number {
  const n = Number(typeof value === 'string' ? value.replace(',', '.') : value);
  if (!Number.isFinite(n) || n < 0 || n > 50 || Math.round(n * 100) !== n * 100)
    throw bad('vatRate', { field });
  return n;
}

function slug(value: unknown, fallbackFrom: string, max: number, field: string): string {
  const raw =
    typeof value === 'string' && value.trim()
      ? value.trim().toLowerCase()
      : slugify(fallbackFrom, max);
  if (!SLUG.test(raw) || raw.length > max) throw bad('slug', { field });
  return raw;
}

export function storeInput(body: Body): StoreInput {
  const name = requiredText(body.name, 'storeName', LIMITS.storeName);
  const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';
  if (!isCurrency(currency)) throw bad('currency');
  return {
    name,
    slug: slug(body.slug, name, LIMITS.slug, 'slug'),
    tagline: optionalText(body.tagline, 'tagline', LIMITS.tagline),
    about: longOptionalText(body.about, 'about', LIMITS.about),
    currency,
    vatRate: vatRate(body.vatRate ?? 0),
    published: bool(body.published),
  };
}

function email(value: unknown, field: string): string | null {
  const text = optionalText(value, field, LIMITS.email);
  if (text && !isEmail(text)) throw bad('email', { field });
  return text;
}

export function legalInput(body: Body): LegalInput {
  return {
    companyName: optionalText(body.companyName, 'companyName', 120),
    companyNumber: optionalText(body.companyNumber, 'companyNumber', 60),
    vatNumber: optionalText(body.vatNumber, 'vatNumber', 40),
    address: optionalText(body.address, 'address', 255),
    email: email(body.email, 'contactEmail'),
    phone: optionalText(body.phone, 'phone', LIMITS.phone),
    terms: longOptionalText(body.terms, 'terms', LIMITS.legalText),
    returnsPolicy: longOptionalText(body.returnsPolicy, 'returnsPolicy', LIMITS.legalText),
    showAnpc: bool(body.showAnpc),
  };
}

/** A secret from a form: undefined (not sent) keeps it, '' removes it, else the new value. */
function secret(value: unknown, field: string, pattern: RegExp): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw bad('mustBeText', { field });
  const text = value.trim();
  if (text === '') return '';
  if (text.length > 400 || !pattern.test(text)) throw bad('secretFormat', { field });
  return text;
}

export function paymentsInput(body: Body, canKeepSecrets: boolean): PaymentsInput {
  const b = (body.bank ?? {}) as Body;
  const c = (body.cod ?? {}) as Body;
  const s = (body.stripe ?? {}) as Body;
  const p = (body.paypal ?? {}) as Body;
  const ibanText = optionalText(b.iban, 'iban', 50);
  const iban = ibanText ? cleanIban(ibanText) : null;
  if (ibanText && !iban) throw bad('iban');
  const input: PaymentsInput = {
    cod: { enabled: bool(c.enabled), feeCents: optionalCents(c.fee, 'codFee') ?? 0 },
    bank: {
      enabled: bool(b.enabled),
      holder: optionalText(b.holder, 'bankHolder', 120),
      iban,
      bankName: optionalText(b.bankName, 'bankName', 80),
    },
    stripe: {
      enabled: bool(s.enabled),
      secret: secret(s.secret, 'stripeSecret', /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/),
      webhook: secret(s.webhook, 'stripeWebhook', /^whsec_[A-Za-z0-9+/=]+$/),
    },
    paypal: {
      enabled: bool(p.enabled),
      live: bool(p.live),
      clientId: optionalText(p.clientId, 'paypalClientId', 120),
      secret: secret(p.secret, 'paypalSecret', /^[A-Za-z0-9_-]+$/),
    },
  };
  if (input.bank.enabled && (!input.bank.iban || !input.bank.holder)) throw bad('bankIncomplete');
  const newSecrets = [input.stripe.secret, input.stripe.webhook, input.paypal.secret].some(
    (x) => x,
  );
  if (newSecrets && !canKeepSecrets) throw new HttpError(503, 'noMasterKey');
  return input;
}

export function zonesInput(body: Body): Omit<Zone, 'id'>[] {
  if (!Array.isArray(body.zones) || body.zones.length > LIMITS.zonesPerStore)
    throw bad('invalidRequest');
  const taken = new Set<string>();
  return body.zones.map((raw) => {
    const z = (raw ?? {}) as Body;
    const list = Array.isArray(z.countries) ? z.countries : [];
    const countries = [...new Set(list.map((c) => String(c).trim().toUpperCase()))];
    if (countries.length === 0 || countries.some((c) => c !== '*' && !isCountry(c)))
      throw bad('countries');
    for (const c of countries) {
      if (taken.has(c)) throw bad('countryTwice', { country: c });
      taken.add(c);
    }
    return {
      name: requiredText(z.name, 'zoneName', 80),
      countries,
      rateCents: cents(z.rate ?? '0', 'shippingRate'),
      freeFromCents: optionalCents(z.freeFrom, 'freeFrom'),
    };
  });
}

/** A sale's start or end from a datetime-local field, in the owner's time zone; null when empty. */
function saleTime(value: unknown, timeZone: string, field: string): Date | null {
  if (value === undefined || value === null || value === '') return null;
  const at = typeof value === 'string' ? localDateTimeToUtc(value, timeZone) : null;
  if (!at) throw bad('dateTime', { field });
  return at;
}

function variantInput(raw: unknown, timeZone: string): VariantInput {
  const v = (raw ?? {}) as Body;
  const priceCents = cents(v.price, 'price');
  const saleCents = optionalCents(v.sale, 'salePrice');
  if (saleCents !== null && saleCents >= priceCents) throw bad('saleNotLower');
  const saleFrom = saleTime(v.saleFrom, timeZone, 'saleFrom');
  const saleUntil = saleTime(v.saleUntil, timeZone, 'saleUntil');
  if (saleFrom && saleUntil && saleUntil <= saleFrom) throw bad('saleWindow');
  let stock: number | null = null;
  if (v.stock !== undefined && v.stock !== null && v.stock !== '') {
    stock = Number(v.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) throw bad('stock');
  }
  return {
    id: v.id === undefined || v.id === null ? null : id(v.id),
    name: optionalText(v.name, 'variantName', LIMITS.variantName) ?? '',
    sku: optionalText(v.sku, 'sku', LIMITS.sku),
    priceCents,
    saleCents,
    saleFrom: saleCents === null ? null : saleFrom,
    saleUntil: saleCents === null ? null : saleUntil,
    stock,
  };
}

function optionalId(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  return id(value);
}

/** A product's field values as sent (field id → value), checked later against its type. */
function rawValues(value: unknown): Record<number, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw bad('invalidRequest');
  const out: Record<number, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(k);
    if (!Number.isSafeInteger(n) || n <= 0) throw bad('invalidRequest');
    out[n] = v;
  }
  return out;
}

/** The values of the type's fields (others are dropped); errors name the field. */
export function checkValues(
  fields: FieldDef[],
  raw: Record<number, unknown>,
): Record<number, string> {
  const out: Record<number, string> = {};
  for (const f of fields) {
    const r = fieldValue(f, raw[f.id]);
    if (!r.ok) throw bad(`fieldValue.${r.problem}`, { label: f.label });
    out[f.id] = r.value;
  }
  return out;
}

export function productInput(
  body: Body,
  timeZone: string,
): Omit<ProductInput, 'values'> & { rawValues: Record<number, unknown> } {
  const name = requiredText(body.name, 'productName', LIMITS.productName);
  if (!Array.isArray(body.variants) || body.variants.length === 0) throw bad('noVariants');
  if (body.variants.length > LIMITS.variantsPerProduct)
    throw bad('tooManyVariants', { max: LIMITS.variantsPerProduct });
  const variants = body.variants.map((v) => variantInput(v, timeZone));
  if (variants.length > 1 && variants.some((v) => !v.name)) throw bad('variantNames');
  const ids = variants.map((v) => v.id).filter((x) => x !== null);
  if (new Set(ids).size !== ids.length) throw bad('invalidRequest');
  const gtin = optionalText(body.gtin, 'gtin', 20)?.replace(/\s/g, '') ?? null;
  if (gtin && !isGtin(gtin)) throw bad('gtin');
  return {
    name,
    slug: slug(body.slug, name, 80, 'productSlug'),
    summary: optionalText(body.summary, 'summary', LIMITS.summary),
    description: longOptionalText(body.description, 'description', LIMITS.description),
    seoTitle: optionalText(body.seoTitle, 'seoTitle', SEO_LIMITS.title),
    seoDescription: optionalText(body.seoDescription, 'seoDescription', SEO_LIMITS.description),
    gtin,
    typeId: optionalId(body.typeId),
    vendorId: optionalId(body.vendorId),
    rawValues: rawValues(body.values),
    category: optionalText(body.category, 'category', LIMITS.category),
    vatRate:
      body.vatRate === undefined || body.vatRate === null || body.vatRate === ''
        ? null
        : vatRate(body.vatRate),
    published: bool(body.published),
    variants,
  };
}

export function trackingInput(body: Body): {
  carrier: CarrierCode | null;
  number: string | null;
  url: string | null;
} {
  const carrier =
    body.carrier === null || body.carrier === '' || body.carrier === undefined
      ? null
      : body.carrier;
  if (carrier !== null && !isCarrier(carrier)) throw bad('carrier');
  const url = optionalText(body.url, 'trackingUrl', 500);
  if (url && !/^https:\/\/\S+$/.test(url)) throw bad('trackingUrl');
  return { carrier, number: optionalText(body.number, 'trackingNumber', 80), url };
}

export function buyerInput(body: Body): Buyer {
  const b = (body.buyer ?? {}) as Body;
  const email = optionalText(b.email, 'email', LIMITS.email);
  if (!email || !isEmail(email)) throw bad('email', { field: 'email' });
  const country = typeof b.country === 'string' ? b.country.trim().toUpperCase() : '';
  if (!isCountry(country)) throw bad('country');
  return {
    name: requiredText(b.name, 'buyerName', LIMITS.buyerName),
    email,
    // Couriers call before delivering.
    phone: requiredText(b.phone, 'phone', LIMITS.phone),
    addressLine: requiredText(b.addressLine, 'addressLine', LIMITS.addressLine),
    city: requiredText(b.city, 'city', LIMITS.city),
    postalCode: optionalText(b.postalCode, 'postalCode', LIMITS.postalCode),
    country,
    note: longOptionalText(b.note, 'orderNote', LIMITS.note),
  };
}

/** A buyer's saved delivery details (ADR 0059): every field optional. */
export function buyerDetailsInput(body: Body): BuyerDetails {
  const raw = typeof body.country === 'string' ? body.country.trim().toUpperCase() : '';
  if (raw && !isCountry(raw)) throw bad('country');
  return {
    phone: optionalText(body.phone, 'phone', LIMITS.phone),
    addressLine: optionalText(body.addressLine, 'addressLine', LIMITS.addressLine),
    city: optionalText(body.city, 'city', LIMITS.city),
    postalCode: optionalText(body.postalCode, 'postalCode', LIMITS.postalCode),
    country: raw || null,
  };
}

export function paymentMethod(value: unknown): PaymentMethod {
  if (!isPaymentMethod(value)) throw bad('paymentMethod');
  return value;
}

function timeWindow(body: Body, timeZone: string) {
  const startsAt = saleTime(body.startsAt, timeZone, 'startsAt');
  const endsAt = saleTime(body.endsAt, timeZone, 'endsAt');
  if (startsAt && endsAt && endsAt <= startsAt) throw bad('window');
  return { startsAt, endsAt, active: body.active === undefined ? true : bool(body.active) };
}

function percent(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 90) throw bad('percent', { field });
  return n;
}

function pick<T extends string>(value: unknown, list: readonly T[]): T {
  if (!list.includes(value as T)) throw bad('invalidRequest');
  return value as T;
}

function idList(value: unknown, max: number): number[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > max) throw bad('invalidRequest');
  return [...new Set(value.map(id))];
}

export function seoInput(body: Body) {
  return {
    seoTitle: optionalText(body.seoTitle, 'seoTitle', SEO_LIMITS.title),
    seoDescription: optionalText(body.seoDescription, 'seoDescription', SEO_LIMITS.description),
  };
}

/** An https:// link, or a path in the app ("/s/shop?category=…"). */
function link(value: unknown, field: string): string | null {
  const text = optionalText(value, field, 500);
  if (text && !/^https:\/\/\S+$/.test(text) && !/^\/(?!\/)\S*$/.test(text))
    throw bad('link', { field });
  return text;
}

export function vendorInput(body: Body): VendorInput {
  const website = optionalText(body.website, 'website', 300);
  if (website && !/^https?:\/\/\S+$/.test(website)) throw bad('link', { field: 'website' });
  return {
    name: requiredText(body.name, 'vendorName', 80),
    contactName: optionalText(body.contactName, 'contactName', 80),
    email: email(body.email, 'email'),
    phone: optionalText(body.phone, 'phone', LIMITS.phone),
    website,
    notes: longOptionalText(body.notes, 'notes', 2000),
    isBrand: body.isBrand === undefined ? true : bool(body.isBrand),
  };
}

export function typeInput(body: Body): { name: string; fields: FieldInput[] } {
  const name = requiredText(body.name, 'typeName', FIELD_LIMITS.typeName);
  if (!Array.isArray(body.fields) || body.fields.length > FIELD_LIMITS.fieldsPerType)
    throw bad('tooManyFields', { max: FIELD_LIMITS.fieldsPerType });
  const fields = body.fields.map((raw): FieldInput => {
    const f = (raw ?? {}) as Body;
    if (!isFieldKind(f.kind)) throw bad('invalidRequest');
    const listed = f.kind === 'select' || f.kind === 'multiselect';
    const choices = listed ? parseChoices(f.choices) : [];
    const label = requiredText(f.label, 'fieldLabel', FIELD_LIMITS.label);
    if (listed && choices.length === 0) throw bad('noChoices', { label });
    return {
      id: f.id === undefined || f.id === null ? null : id(f.id),
      label,
      kind: f.kind,
      unit:
        f.kind === 'number' || f.kind === 'text'
          ? optionalText(f.unit, 'unit', FIELD_LIMITS.unit)
          : null,
      choices,
      required: bool(f.required),
      inCompare: f.inCompare === undefined ? true : bool(f.inCompare),
    };
  });
  const labels = fields.map((f) => f.label.toLowerCase());
  if (new Set(labels).size !== labels.length) throw bad('fieldTwice');
  return { name, fields };
}

export function campaignInput(body: Body, timeZone: string): CampaignInput {
  const scope = pick(body.scope, CAMPAIGN_SCOPES);
  const category =
    scope === 'category' ? requiredText(body.category, 'category', LIMITS.category) : null;
  const productIds =
    scope === 'products' ? idList(body.productIds, MARKETING_LIMITS.campaignProducts) : [];
  if (scope === 'products' && productIds.length === 0) throw bad('noProducts');
  return {
    name: requiredText(body.name, 'campaignName', MARKETING_LIMITS.name),
    description: optionalText(body.description, 'description', MARKETING_LIMITS.description),
    percentOff: percent(body.percentOff, 'percentOff'),
    scope,
    category,
    productIds,
    ...timeWindow(body, timeZone),
  };
}

export function voucherInput(body: Body, timeZone: string): VoucherInput {
  const code = normalizeCode(typeof body.code === 'string' ? body.code : '');
  if (!VOUCHER_CODE.test(code)) throw bad('voucherCode');
  const kind = pick(body.kind, VOUCHER_KINDS);
  const maxUses =
    body.maxUses === undefined || body.maxUses === null || body.maxUses === ''
      ? null
      : Number(body.maxUses);
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1_000_000))
    throw bad('maxUses');
  return {
    code,
    description: optionalText(body.description, 'description', MARKETING_LIMITS.voucherDescription),
    kind,
    percentOff: kind === 'percent' ? percent(body.percentOff, 'percentOff') : null,
    amountCents: kind === 'amount' ? cents(body.amount, 'voucherAmount') : null,
    minOrderCents: optionalCents(body.minOrder, 'minOrder'),
    maxUses,
    oncePerBuyer: bool(body.oncePerBuyer),
    ...timeWindow(body, timeZone),
  };
}

export function announcementInput(body: Body, timeZone: string): AnnouncementInput {
  const linkUrl = link(body.linkUrl, 'linkUrl');
  return {
    message: requiredText(body.message, 'message', MARKETING_LIMITS.message),
    details: optionalText(body.details, 'details', MARKETING_LIMITS.details),
    tone: pick(body.tone, ANNOUNCEMENT_TONES),
    placement: pick(body.placement, ANNOUNCEMENT_PLACEMENTS),
    linkUrl,
    linkLabel: linkUrl
      ? optionalText(body.linkLabel, 'linkLabel', MARKETING_LIMITS.linkLabel)
      : null,
    voucherId: optionalId(body.voucherId),
    campaignId: optionalId(body.campaignId),
    ...timeWindow(body, timeZone),
  };
}

export function reviewInput(body: Body) {
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw bad('rating');
  return {
    rating,
    title: optionalText(body.title, 'reviewTitle', REVIEW_LIMITS.title),
    body: longOptionalText(body.body, 'reviewBody', REVIEW_LIMITS.body),
    author: requiredText(body.author, 'author', REVIEW_LIMITS.author),
  };
}

export function replyText(value: unknown): string | null {
  return longOptionalText(value, 'reply', REVIEW_LIMITS.reply);
}

export function messageBody(value: unknown): string {
  const text = longOptionalText(value, 'messageBody', MESSAGE_LIMITS.body);
  if (!text) throw bad('required', { field: 'messageBody' });
  return text;
}

export function messageSubject(value: unknown): string {
  return requiredText(value, 'messageSubject', MESSAGE_LIMITS.subject);
}

export function emailAddress(value: unknown): string {
  const text = optionalText(value, 'email', LIMITS.email);
  if (!text || !isEmail(text)) throw bad('email', { field: 'email' });
  return text.toLowerCase();
}

export function newsletterInput(body: Body): NewsletterInput {
  const list = Array.isArray(body.products) ? body.products : [];
  if (list.length > NEWSLETTER_LIMITS.products)
    throw bad('tooManyNewsletterProducts', { max: NEWSLETTER_LIMITS.products });
  const seen = new Set<number>();
  const products = list.flatMap((raw) => {
    const p = (raw ?? {}) as Body;
    const productId = id(p.productId);
    if (seen.has(productId)) return [];
    seen.add(productId);
    return [{ productId, section: pick(p.section, NEWSLETTER_SECTIONS) }];
  });
  return {
    subject: requiredText(body.subject, 'subject', NEWSLETTER_LIMITS.subject),
    preheader: optionalText(body.preheader, 'preheader', NEWSLETTER_LIMITS.preheader),
    heading: optionalText(body.heading, 'heading', NEWSLETTER_LIMITS.heading),
    intro: longOptionalText(body.intro, 'intro', NEWSLETTER_LIMITS.intro),
    voucherId: optionalId(body.voucherId),
    products,
  };
}

export function ruleInput(body: Body, timeZone: string): RuleInput {
  const kind = pick(body.kind, RULE_KINDS);
  let threshold: number;
  if (kind === 'quantity') {
    threshold = Number(body.threshold);
    if (!Number.isInteger(threshold) || threshold < 2 || threshold > 1000) throw bad('pieces');
  } else {
    threshold = cents(body.threshold, 'threshold');
    if (threshold <= 0) throw bad('amount', { field: 'threshold' });
  }
  return {
    kind,
    threshold,
    percentOff: kind === 'free_shipping' ? null : percent(body.percentOff, 'percentOff'),
    ...timeWindow(body, timeZone),
  };
}

/** A team member's roles: at least one known role. */
export function rolesInput(value: unknown): StaffRole[] {
  if (!Array.isArray(value)) throw bad('roles');
  const roles = parseRoles(value);
  if (roles.length === 0 || roles.length !== new Set(value).size) throw bad('roles');
  return roles;
}
