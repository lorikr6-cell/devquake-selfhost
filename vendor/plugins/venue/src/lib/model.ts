// Venue: the rules (docs/plugins/ideas/venue.md). Country presets, the EU's 14 allergens, prices
// in whole minor units (cents/bani/fillér), VAT rates in basis points, menu items and staff with
// PINs (ADR 0080). Pure and tested.

/** The EU's 14 allergens (Regulation 1169/2011, Annex II), as bits of an item's mask. */
export const ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const allergenMask = (list: readonly string[]): number =>
  ALLERGENS.reduce((mask, a, i) => (list.includes(a) ? mask | (1 << i) : mask), 0);
export const allergensOf = (mask: number): Allergen[] =>
  ALLERGENS.filter((_, i) => (mask & (1 << i)) !== 0);

export const STATIONS = ['kitchen', 'bar', 'coffee', 'none'] as const;
export type Station = (typeof STATIONS)[number];

export const STAFF_ROLES = ['manager', 'waiter', 'kitchen', 'bar'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export interface CountryPreset {
  country: string;
  currency: string;
  /** VAT rates in basis points (2700 = 27 %), the first is the standard rate. */
  vatRates: number[];
  /** Minor units per major (100 for most; HUF prices are whole forints). */
  decimals: number;
}

/**
 * Ready-made settings (owner's decision): Hungary and Romania; any other country is set up by
 * hand. The rates are the ones in force when this was written; the venue can change them.
 */
export const PRESETS: Record<'HU' | 'RO', CountryPreset> = {
  HU: { country: 'HU', currency: 'HUF', vatRates: [2700, 1800, 500], decimals: 0 },
  RO: { country: 'RO', currency: 'RON', vatRates: [2100, 1100], decimals: 2 },
};

export const NAME_MAX = 80;
export const TEXT_MAX = 400;
export const PRICE_MAX = 100_000_000;

export type Check<T> =
  { ok: true; value: T } | { ok: false; error: string; field?: string; max?: number };

const line = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

/** A price as typed ("4.50", "4,50", "1200") in minor units for this many decimals. */
export function parsePrice(raw: unknown, decimals: number): number | null {
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.') as [string, string?];
  if (frac.length > decimals) return null;
  const minor = Number(whole) * 10 ** decimals + Number((frac + '00').slice(0, decimals) || 0);
  return Number.isSafeInteger(minor) && minor <= PRICE_MAX ? minor : null;
}

/** Minor units back to a plain number string ("4.50", "1200"). */
export const formatMinor = (minor: number, decimals: number): string =>
  decimals ? (minor / 10 ** decimals).toFixed(decimals) : String(minor);

export interface VenueInput {
  name: string;
  country: string;
  currency: string;
  vatRates: number[];
  decimals: number;
}

export function checkVenue(raw: Record<string, unknown>): Check<VenueInput> {
  const name = line(raw.name);
  if (!name) return { ok: false, error: 'required', field: 'name' };
  if (name.length > NAME_MAX) return { ok: false, error: 'tooLong', field: 'name', max: NAME_MAX };
  const country = line(raw.country).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return { ok: false, error: 'country', field: 'country' };
  const preset = PRESETS[country as 'HU' | 'RO'];
  const currency = (line(raw.currency) || preset?.currency || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: 'currency', field: 'currency' };
  const rates = Array.isArray(raw.vatRates)
    ? raw.vatRates
    : String(raw.vatRates ?? '')
        .split(/[,;\s]+/)
        .filter(Boolean);
  const vatRates = (rates.length ? rates : (preset?.vatRates.map((r) => r / 100) ?? []))
    .map((r) => Math.round(Number(String(r).replace(',', '.')) * 100))
    .filter((r, i, all) => Number.isInteger(r) && r >= 0 && r <= 10000 && all.indexOf(r) === i);
  if (!vatRates.length) return { ok: false, error: 'vatRates', field: 'vatRates' };
  const decimals = raw.decimals === undefined ? (preset?.decimals ?? 2) : Number(raw.decimals);
  if (![0, 2].includes(decimals)) return { ok: false, error: 'decimals', field: 'decimals' };
  return { ok: true, value: { name, country, currency, vatRates, decimals } };
}

export interface ItemInput {
  categoryId: number;
  name: string;
  description: string | null;
  priceMinor: number;
  vatRate: number;
  station: Station;
  allergens: number;
  available: boolean;
}

export function checkItem(
  raw: Record<string, unknown>,
  venue: { decimals: number; vatRates: number[] },
): Check<ItemInput> {
  const name = line(raw.name);
  if (!name) return { ok: false, error: 'required', field: 'name' };
  if (name.length > NAME_MAX) return { ok: false, error: 'tooLong', field: 'name', max: NAME_MAX };
  const description = line(raw.description) || null;
  if (description && description.length > TEXT_MAX)
    return { ok: false, error: 'tooLong', field: 'description', max: TEXT_MAX };
  const priceMinor = parsePrice(raw.price, venue.decimals);
  if (priceMinor === null) return { ok: false, error: 'price', field: 'price' };
  const vatRate = Number(raw.vatRate);
  if (!venue.vatRates.includes(vatRate)) return { ok: false, error: 'vatRate', field: 'vatRate' };
  const station = STATIONS.includes(raw.station as Station) ? (raw.station as Station) : 'kitchen';
  const list = Array.isArray(raw.allergens) ? raw.allergens.map(String) : [];
  return {
    ok: true,
    value: {
      categoryId: Number(raw.categoryId) || 0,
      name,
      description,
      priceMinor,
      vatRate,
      station,
      allergens: allergenMask(list),
      available: raw.available !== false,
    },
  };
}

/** A staff PIN: 4 to 6 digits, not all the same and not a plain run like 1234. */
export function checkPin(raw: unknown): Check<string> {
  const pin = String(raw ?? '').trim();
  if (!/^\d{4,6}$/.test(pin)) return { ok: false, error: 'pin', field: 'pin' };
  if (/^(\d)\1+$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin))
    return { ok: false, error: 'pinWeak', field: 'pin' };
  return { ok: true, value: pin };
}

export function checkStaff(raw: Record<string, unknown>): Check<{ name: string; role: StaffRole }> {
  const name = line(raw.name);
  if (!name) return { ok: false, error: 'required', field: 'name' };
  if (name.length > NAME_MAX) return { ok: false, error: 'tooLong', field: 'name', max: NAME_MAX };
  const role = STAFF_ROLES.includes(raw.role as StaffRole) ? (raw.role as StaffRole) : null;
  if (!role) return { ok: false, error: 'role', field: 'role' };
  return { ok: true, value: { name, role } };
}

// --- tips (owner's request, 2026-10-30) ----------------------------------------------------

export const TIP_MODES = ['off', 'percent', 'fixed'] as const;
export type TipMode = (typeof TIP_MODES)[number];

export interface TipSettings {
  tipMode: TipMode;
  /** The choices offered on the bill, basis points (1500 = 15 %), counted before VAT. */
  tipPercents: number[];
  /** The fixed tip in minor units (mode 'fixed'). */
  tipFixedMinor: number;
}

/** The usual tips for good to exceptional service: 15, 20 and 25 % of the bill before VAT. */
export const DEFAULT_TIPS: TipSettings = {
  tipMode: 'percent',
  tipPercents: [1500, 2000, 2500],
  tipFixedMinor: 0,
};

/** At most this many choices on the bill, each at most 100 %. */
export const TIP_CHOICES_MAX = 5;

export function checkTips(raw: Record<string, unknown>, decimals: number): Check<TipSettings> {
  const tipMode = TIP_MODES.includes(raw.tipMode as TipMode) ? (raw.tipMode as TipMode) : null;
  if (!tipMode) return { ok: false, error: 'tipMode', field: 'tipMode' };
  const list = Array.isArray(raw.tipPercents)
    ? raw.tipPercents
    : String(raw.tipPercents ?? '')
        .split(/[,;\s]+/)
        .filter(Boolean);
  const tipPercents = list
    .map((p) => Math.round(Number(String(p).replace(',', '.')) * 100))
    .filter((p, i, all) => Number.isInteger(p) && p > 0 && p <= 10000 && all.indexOf(p) === i)
    .sort((a, b) => a - b);
  if (tipMode === 'percent' && (!tipPercents.length || tipPercents.length > TIP_CHOICES_MAX))
    return { ok: false, error: 'tipPercents', field: 'tipPercents', max: TIP_CHOICES_MAX };
  const fixed =
    raw.tipFixed === undefined || raw.tipFixed === '' ? 0 : parsePrice(raw.tipFixed, decimals);
  if (fixed === null || (tipMode === 'fixed' && fixed <= 0))
    return { ok: false, error: 'tipFixed', field: 'tipFixed' };
  return {
    ok: true,
    value: {
      tipMode,
      tipPercents: tipPercents.length ? tipPercents : DEFAULT_TIPS.tipPercents,
      tipFixedMinor: fixed,
    },
  };
}

/**
 * The tips to offer on a bill, in minor units, from its amount before VAT (rounded to the
 * nearest minor unit): none when tips are off, the fixed tip, or one per percentage.
 */
export function tipChoices(
  netMinor: number,
  tips: TipSettings,
): { percent: number | null; amount: number }[] {
  if (tips.tipMode === 'off') return [];
  if (tips.tipMode === 'fixed') return [{ percent: null, amount: tips.tipFixedMinor }];
  return tips.tipPercents.map((p) => ({ percent: p, amount: Math.round((netMinor * p) / 10000) }));
}
