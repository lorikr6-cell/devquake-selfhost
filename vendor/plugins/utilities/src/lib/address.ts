// The profile address in parts, and address suggestions from OpenStreetMap (Photon). Pure:
// used by the API, pages, the profile form and tests (address.test.ts).

/** ISO 3166-1 alpha-2 country codes; names come from Intl.DisplayNames in the page language. */
// prettier-ignore
export const COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
  'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
  'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
  'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
  'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
  'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
  'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
  'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
  'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
  'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
  'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'ZA', 'ZM', 'ZW',
] as const;

export function isCountryCode(value: unknown): value is string {
  return typeof value === 'string' && (COUNTRY_CODES as readonly string[]).includes(value);
}

/** The country preselected for a page language (Romanian → Romania, and so on). */
export const DEFAULT_COUNTRY: Record<string, string | null> = {
  en: null,
  de: 'DE',
  ro: 'RO',
  hu: 'HU',
};

/** The country's name in a language (BCP 47 tag); the code itself when unknown. */
export function countryName(code: string, tag = 'en-GB'): string {
  try {
    return new Intl.DisplayNames([tag], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Every country as { code, name } in a language, sorted by name. */
export function countries(tag = 'en-GB'): { code: string; name: string }[] {
  const collator = new Intl.Collator(tag);
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code, tag) })).sort((a, b) =>
    collator.compare(a.name, b.name),
  );
}

export interface AddressParts {
  countryCode: string;
  /** State, county or region. */
  state: string;
  city: string;
  street: string;
  houseNumber: string;
  apartment: string | null;
}

/**
 * The address on one line: "Strada Memorandumului 12, ap. 3, Cluj-Napoca, Cluj, Romania".
 * `apartmentLabel` is the short word for an apartment in the reader's language ("ap.").
 */
export function formatAddress(
  parts: AddressParts,
  country: string,
  apartmentLabel = 'ap.',
): string {
  return [
    `${parts.street} ${parts.houseNumber}`.trim(),
    parts.apartment ? `${apartmentLabel} ${parts.apartment}` : null,
    parts.city,
    parts.state,
    country,
  ]
    .filter((p): p is string => !!p && p.trim() !== '')
    .join(', ');
}

// ---------------------------------------------------------------------------------------------
// Suggestions (Photon, https://photon.komoot.io: OpenStreetMap search made for type-ahead)

export const SUGGEST_FIELDS = ['state', 'city', 'street'] as const;
export type SuggestField = (typeof SUGGEST_FIELDS)[number];

export interface SuggestQuery {
  field: SuggestField;
  /** What the person typed so far (at least 2 characters). */
  q: string;
  countryCode: string;
  /** Narrows city and street suggestions when known. */
  state?: string;
  city?: string;
}

const LAYERS: Record<SuggestField, string[]> = {
  state: ['state', 'county'],
  city: ['city'],
  street: ['street'],
};

export const PHOTON_URL = 'https://photon.komoot.io/api/';

/** The Photon request for a query. Local names (no `lang`): an address is written locally. */
export function photonUrl(query: SuggestQuery): string {
  const params = new URLSearchParams();
  // Streets are easier to find with the city in the text.
  const text = query.field === 'street' && query.city ? `${query.q} ${query.city}` : query.q;
  params.set('q', text);
  params.set('limit', '15');
  params.set('countrycode', query.countryCode);
  for (const layer of LAYERS[query.field]) params.append('layer', layer);
  return `${PHOTON_URL}?${params}`;
}

interface PhotonFeature {
  properties?: {
    name?: string;
    countrycode?: string;
    state?: string;
    county?: string;
    city?: string;
    type?: string;
  };
}

/** Case- and accent-insensitive text, to compare what was typed with a name. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Suggestion texts from a Photon answer: names in the right country (and state or city when
 * given), without duplicates, the ones starting with what was typed first. At most 8.
 */
export function suggestionsFrom(answer: unknown, query: SuggestQuery): string[] {
  const features = (answer as { features?: PhotonFeature[] } | null)?.features ?? [];
  const typed = fold(query.q);
  const state = query.state ? fold(query.state) : null;
  const city = query.city ? fold(query.city) : null;
  const seen = new Set<string>();
  const names: string[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const name = p.name?.trim();
    if (!name || p.countrycode?.toUpperCase() !== query.countryCode) continue;
    if (query.field !== 'state' && state) {
      const region = fold(p.state ?? p.county ?? '');
      if (region && region !== state) continue;
    }
    if (query.field === 'street' && city && p.city && fold(p.city) !== city) continue;
    const key = fold(name);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  const starts = (n: string) => (fold(n).startsWith(typed) ? 0 : 1);
  return names.sort((a, b) => starts(a) - starts(b)).slice(0, 8);
}
