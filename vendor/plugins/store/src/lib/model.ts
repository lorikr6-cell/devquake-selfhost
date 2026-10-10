// What a store, its products and its orders can be: pure, shared by pages, the API and tests.

export const LIMITS = {
  storeName: 80,
  tagline: 160,
  about: 4000,
  slug: 60,
  productName: 120,
  summary: 300,
  description: 8000,
  category: 60,
  variantName: 80,
  sku: 60,
  variantsPerProduct: 30,
  photosPerProduct: 8,
  productsPerStore: 2000,
  zonesPerStore: 30,
  legalText: 20000,
  /** Lines in one order and pieces of one line. */
  cartLines: 50,
  quantity: 99,
  buyerName: 120,
  email: 160,
  phone: 40,
  addressLine: 255,
  city: 80,
  postalCode: 20,
  note: 500,
} as const;

export const ORDER_STATUSES = [
  'awaiting_payment',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** How the shop orders its products (?sort=). */
export const PRODUCT_SORTS = ['position', 'newest', 'priceLow', 'priceHigh', 'rating'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const PAYMENT_METHODS = ['stripe', 'paypal', 'bank', 'cod'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const isPaymentMethod = (v: unknown): v is PaymentMethod =>
  PAYMENT_METHODS.includes(v as PaymentMethod);

/** Currencies offered first; any three-letter code is accepted. */
export const CURRENCIES = ['EUR', 'RON', 'HUF', 'USD', 'GBP', 'CHF', 'PLN', 'CZK'] as const;
export const isCurrency = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Z]{3}$/.test(v);

/** Countries offered for shipping zones and addresses (names come from Intl.DisplayNames). */
export const COUNTRIES = [
  'RO',
  'MD',
  'HU',
  'DE',
  'AT',
  'IT',
  'FR',
  'ES',
  'PT',
  'NL',
  'BE',
  'LU',
  'IE',
  'DK',
  'SE',
  'FI',
  'EE',
  'LV',
  'LT',
  'PL',
  'CZ',
  'SK',
  'SI',
  'HR',
  'BG',
  'GR',
  'CY',
  'MT',
  'GB',
  'CH',
  'NO',
  'IS',
  'RS',
  'UA',
  'US',
  'CA',
] as const;
export const isCountry = (v: unknown): v is string => typeof v === 'string' && /^[A-Z]{2}$/.test(v);

/** Letters and digits without look-alikes, for order codes. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
export const ORDER_CODE = /^[A-HJ-KM-NP-Za-hj-km-np-z2-9]{20}$/;

export function newOrderCode(random: (max: number) => number): string {
  let code = '';
  for (let i = 0; i < 20; i++) code += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  return code;
}

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Cămașă albă, mărimea M!" → "camasa-alba-marimea-m". */
export function slugify(text: string, max: number = LIMITS.slug): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
}

/** Couriers with a tracking page; `other` uses the link the owner typed. */
export const CARRIERS = [
  { code: 'sameday', name: 'Sameday', url: 'https://sameday.ro/#awb={n}' },
  { code: 'fan', name: 'FAN Courier', url: 'https://www.fancourier.ro/awb-tracking/?tracking={n}' },
  {
    code: 'cargus',
    name: 'Cargus',
    url: 'https://www.cargus.ro/personal/urmareste-coletul/?tracking_number={n}',
  },
  { code: 'dpd', name: 'DPD', url: 'https://tracking.dpd.de/status/en_US/parcel/{n}' },
  { code: 'gls', name: 'GLS', url: 'https://gls-group.com/track/{n}' },
  {
    code: 'dhl',
    name: 'DHL',
    url: 'https://www.dhl.com/global-en/home/tracking.html?tracking-id={n}',
  },
  { code: 'ups', name: 'UPS', url: 'https://www.ups.com/track?tracknum={n}' },
  {
    code: 'posta',
    name: 'Poșta Română',
    url: 'https://www.posta-romana.ro/track-trace.html?id={n}',
  },
  { code: 'other', name: '', url: '' },
] as const;
export type CarrierCode = (typeof CARRIERS)[number]['code'];
export const isCarrier = (v: unknown): v is CarrierCode => CARRIERS.some((c) => c.code === v);

/** The courier's tracking page for a number; the owner's own link for `other`. */
export function trackingLink(
  carrier: CarrierCode,
  number: string,
  own: string | null,
): string | null {
  if (carrier === 'other') return own && /^https:\/\/\S+$/.test(own) ? own : null;
  const c = CARRIERS.find((x) => x.code === carrier);
  return c && number ? c.url.replace('{n}', encodeURIComponent(number)) : null;
}

/**
 * Where an order may go next, set by the owner. Cash on delivery ships before it is paid (the
 * courier collects) and counts as paid once delivered. Cancelling gives the stock back.
 */
export function nextStatuses(from: OrderStatus, method: PaymentMethod): OrderStatus[] {
  switch (from) {
    case 'awaiting_payment':
      return method === 'cod' ? ['shipped', 'paid', 'cancelled'] : ['paid', 'cancelled'];
    case 'paid':
      return ['shipped', 'cancelled'];
    case 'shipped':
      return ['delivered', 'cancelled'];
    default:
      return [];
  }
}

export interface CartLine {
  variantId: number;
  quantity: number;
}

/** A cart from the browser: known shape only, same option once, sensible quantities. */
export function parseCart(value: unknown): CartLine[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > LIMITS.cartLines) return null;
  const seen = new Set<number>();
  const lines: CartLine[] = [];
  for (const raw of value) {
    const l = (raw ?? {}) as { variantId?: unknown; quantity?: unknown };
    const variantId = Number(l.variantId);
    const quantity = Number(l.quantity);
    if (!Number.isSafeInteger(variantId) || variantId <= 0 || seen.has(variantId)) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.quantity) return null;
    seen.add(variantId);
    lines.push({ variantId, quantity });
  }
  return lines;
}

/** "DE89 3704 0044 0532 0130 00" → "DE89370400440532013000"; null when the checksum fails. */
export function cleanIban(value: string): string | null {
  const iban = value.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return null;
  const moved = iban.slice(4) + iban.slice(0, 4);
  const digits = moved.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
  return rest === 1 ? iban : null;
}

/** "RO49AAAA1B31007593840000" → "RO49 AAAA 1B31 0075 9384 0000". */
export const formatIban = (iban: string) => iban.replace(/(.{4})/g, '$1 ').trim();

/** The reference a buyer writes on a bank transfer: the order's number, not its secret code. */
export const orderReference = (orderId: number) => `ORDER-${orderId}`;

/** A plain e-mail address check (the shop writes to it by hand; no mail is sent from here yet). */
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
