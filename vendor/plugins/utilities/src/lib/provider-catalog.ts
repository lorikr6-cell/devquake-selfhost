// "Search for available utility services": providers to suggest for where the person lives, by
// country and county / state. Pure and tested (provider-catalog.test.ts). These are suggestions
// to start from, not a statement of who serves an address: the person picks or types their own.
//
// Keep it short and correct rather than complete. Electricity: the region's former incumbent
// supplier first, then the large national ones. Water: the regional operator of the county.
// Countries without an entry get no suggestions (the person adds utilities by hand).

import { fold } from './address';
import type { CategoryCode } from './model';

type Providers = Partial<Record<CategoryCode, string[]>>;

interface CountryCatalog {
  currency: string;
  /** Offered everywhere in the country, after the regional ones. */
  national: Providers;
  /** By county / state, keyed by `regionKey` of its name. */
  regions: Record<string, Providers>;
}

/** A county or state name made comparable: no accents, case or "Județul", "County", "Sector 3". */
export function regionKey(name: string): string {
  return fold(name)
    .replace(/\b(judetul|judet|county|municipiul|megye|bundesland|land|state)\b/g, ' ')
    .replace(/\bsector(ul)?\s*\d\b/g, ' ')
    .replace(/[-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Romania -----------------------------------------------------------------------------------

const RO_ELECTRICITY_INCUMBENT: Record<string, string[]> = {
  'PPC Energie': [
    'Bucuresti',
    'Ilfov',
    'Giurgiu',
    'Timis',
    'Arad',
    'Caras Severin',
    'Hunedoara',
    'Constanta',
    'Tulcea',
    'Calarasi',
    'Ialomita',
  ],
  'Electrica Furnizare': [
    'Cluj',
    'Bihor',
    'Maramures',
    'Satu Mare',
    'Salaj',
    'Bistrita Nasaud',
    'Brasov',
    'Alba',
    'Sibiu',
    'Mures',
    'Harghita',
    'Covasna',
    'Prahova',
    'Dambovita',
    'Buzau',
    'Braila',
    'Galati',
    'Vrancea',
  ],
  'E.ON Energie România': ['Iasi', 'Bacau', 'Botosani', 'Neamt', 'Suceava', 'Vaslui'],
  Hidroelectrica: ['Dolj', 'Gorj', 'Mehedinti', 'Olt', 'Valcea', 'Arges', 'Teleorman'],
};

/** Counties where E.ON (Delgaz Grid) distributes most of the gas; elsewhere Engie first. */
const RO_GAS_EON_FIRST = [
  'Cluj',
  'Bihor',
  'Mures',
  'Harghita',
  'Covasna',
  'Brasov',
  'Sibiu',
  'Alba',
  'Salaj',
  'Satu Mare',
  'Maramures',
  'Bistrita Nasaud',
  'Iasi',
  'Bacau',
  'Neamt',
  'Suceava',
  'Botosani',
  'Vaslui',
  'Timis',
  'Arad',
  'Hunedoara',
  'Caras Severin',
];

const RO_WATER: Record<string, string> = {
  Bucuresti: 'Apa Nova București',
  Ilfov: 'Apa Nova București',
  Cluj: 'Compania de Apă Someș',
  Salaj: 'Compania de Apă Someș',
  Timis: 'Aquatim',
  Iasi: 'ApaVital',
  Constanta: 'RAJA Constanța',
  Brasov: 'Compania Apa Brașov',
  Bihor: 'Compania de Apă Oradea',
  Arad: 'Compania de Apă Arad',
  Sibiu: 'Apă-Canal Sibiu',
  Dolj: 'Compania de Apă Oltenia',
  Galati: 'Apă Canal Galați',
  Prahova: 'Hidro Prahova',
  Arges: 'Apă Canal 2000',
  Mures: 'Compania Aquaserv',
  Bacau: 'CRAB Bacău',
  Suceava: 'ACET Suceava',
  Maramures: 'Vital Baia Mare',
  'Satu Mare': 'Apaserv Satu Mare',
  Hunedoara: 'Apa Prod Deva',
  Valcea: 'APAVIL Vâlcea',
  Neamt: 'Apa Serv Neamț',
  Buzau: 'Compania de Apă Buzău',
  Braila: 'Compania de Utilități Publice Dunărea Brăila',
  Alba: 'Apa CTTA Alba',
  'Caras Severin': 'Aquacaraș',
  Gorj: 'Aparegio Gorj',
  Tulcea: 'Aquaserv Tulcea',
  Harghita: 'Harviz',
  Vaslui: 'Aquavas',
  Botosani: 'Nova Apaserv Botoșani',
  'Bistrita Nasaud': 'Aquabis',
  Dambovita: 'Compania de Apă Târgoviște Dâmbovița',
  Calarasi: 'Ecoaqua Călărași',
  Giurgiu: 'Apa Service Giurgiu',
  Vrancea: 'CUP Focșani',
};

const RO_HEATING: Record<string, string> = {
  Bucuresti: 'Termoenergetica',
  Timis: 'Colterm',
  Iasi: 'Veolia Energie Iași',
  Bihor: 'Termoficare Oradea',
};

const RO_ELECTRICITY_NATIONAL = [
  'Hidroelectrica',
  'Electrica Furnizare',
  'E.ON Energie România',
  'PPC Energie',
  'Engie România',
  'Premier Energy',
];

function romania(): CountryCatalog {
  const regions: Record<string, Providers> = {};
  const region = (name: string) => (regions[regionKey(name)] ??= {});
  for (const [supplier, counties] of Object.entries(RO_ELECTRICITY_INCUMBENT)) {
    for (const county of counties) region(county).electricity = [supplier];
  }
  const all = Object.values(RO_ELECTRICITY_INCUMBENT).flat();
  for (const county of all) {
    region(county).gas = RO_GAS_EON_FIRST.includes(county)
      ? ['E.ON Energie România', 'Engie România']
      : ['Engie România', 'E.ON Energie România'];
  }
  for (const [county, operator] of Object.entries(RO_WATER)) region(county).water = [operator];
  for (const [county, operator] of Object.entries(RO_HEATING)) region(county).heating = [operator];
  return {
    currency: 'RON',
    national: {
      electricity: RO_ELECTRICITY_NATIONAL,
      gas: ['Engie România', 'E.ON Energie România', 'PPC Energie', 'Premier Energy'],
      internet: ['Digi', 'Orange', 'Vodafone'],
      phone: ['Digi', 'Orange', 'Vodafone'],
      cable: ['Digi', 'Orange', 'Vodafone'],
    },
    regions,
  };
}

// --- Germany and Hungary (national suppliers; local utilities where they are well known) ------

const GERMANY: CountryCatalog = {
  currency: 'EUR',
  national: {
    electricity: ['Stadtwerke', 'E.ON', 'Vattenfall', 'EnBW', 'Octopus Energy'],
    gas: ['Stadtwerke', 'E.ON', 'Vattenfall', 'EnBW'],
    water: ['Stadtwerke'],
    heating: ['Stadtwerke'],
    internet: ['Telekom', 'Vodafone', 'O2', '1&1'],
    phone: ['Telekom', 'Vodafone', 'O2'],
    cable: ['Vodafone', 'Telekom'],
  },
  regions: {
    [regionKey('Berlin')]: {
      electricity: ['Vattenfall'],
      water: ['Berliner Wasserbetriebe'],
    },
    [regionKey('Hamburg')]: {
      electricity: ['Vattenfall', 'Hamburg Energie'],
      water: ['Hamburg Wasser'],
    },
  },
};

const HUNGARY: CountryCatalog = {
  currency: 'HUF',
  national: {
    electricity: ['MVM Next'],
    gas: ['MVM Next'],
    internet: ['Magyar Telekom', 'One Magyarország', 'Yettel'],
    phone: ['Magyar Telekom', 'One Magyarország', 'Yettel'],
    cable: ['Magyar Telekom', 'One Magyarország'],
  },
  regions: {
    [regionKey('Budapest')]: {
      water: ['Fővárosi Vízművek'],
      heating: ['Budapesti Távhőszolgáltató (FŐTÁV)'],
    },
  },
};

const CATALOGS: Record<string, CountryCatalog> = { RO: romania(), DE: GERMANY, HU: HUNGARY };

/**
 * The counties / states offered in the search form, as people write them (any of them may be
 * typed differently: `regionKey` compares them).
 */
// prettier-ignore
const REGION_NAMES: Record<string, string[]> = {
  RO: [
    'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brașov', 'Brăila',
    'București', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița',
    'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov',
    'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj', 'Sibiu',
    'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea',
  ],
  DE: [
    'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
    'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz',
    'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
  ],
  HU: [
    'Budapest', 'Bács-Kiskun', 'Baranya', 'Békés', 'Borsod-Abaúj-Zemplén', 'Csongrád-Csanád',
    'Fejér', 'Győr-Moson-Sopron', 'Hajdú-Bihar', 'Heves', 'Jász-Nagykun-Szolnok',
    'Komárom-Esztergom', 'Nógrád', 'Pest', 'Somogy', 'Szabolcs-Szatmár-Bereg', 'Tolna', 'Vas',
    'Veszprém', 'Zala',
  ],
};

/** The counties / states to offer for a country (empty when there is no list). */
export function regionNames(countryCode: string): string[] {
  return REGION_NAMES[countryCode.toUpperCase()] ?? [];
}

/** The usual spelling of a county / state that was typed or detected differently. */
export function regionName(countryCode: string, region: string): string {
  const key = regionKey(region);
  return regionNames(countryCode).find((n) => regionKey(n) === key) ?? region.trim();
}

/** Whether the list has providers of its own for this county / state (not only national ones). */
export function hasRegionalProviders(countryCode: string, region: string): boolean {
  const regional = CATALOGS[countryCode.toUpperCase()]?.regions[regionKey(region)];
  return !!regional && Object.keys(regional).length > 0;
}

/** Countries with suggestions. */
export const SUGGESTION_COUNTRIES = Object.keys(CATALOGS);

/** Categories ticked by default: what nearly every home pays for. */
export const USUAL_CATEGORIES: readonly CategoryCode[] = [
  'electricity',
  'gas',
  'water',
  'internet',
];

/** The order categories are offered in. */
const ORDER: readonly CategoryCode[] = [
  'electricity',
  'gas',
  'water',
  'heating',
  'internet',
  'phone',
  'cable',
];

export interface ServiceSuggestion {
  category: CategoryCode;
  /** Most likely first; never empty. */
  providers: string[];
  /** Ticked by default. */
  usual: boolean;
}

export interface Suggestions {
  countryCode: string;
  currency: string;
  services: ServiceSuggestion[];
}

/**
 * The services to suggest for a country and county / state (any spelling); null when there are
 * none for the country.
 */
export function suggestionsFor(countryCode: string, region: string | null): Suggestions | null {
  const catalog = CATALOGS[countryCode.toUpperCase()];
  if (!catalog) return null;
  const local = region ? (catalog.regions[regionKey(region)] ?? {}) : {};
  const services: ServiceSuggestion[] = [];
  for (const category of ORDER) {
    const providers = [
      ...new Set([...(local[category] ?? []), ...(catalog.national[category] ?? [])]),
    ];
    if (providers.length === 0) continue;
    services.push({ category, providers, usual: USUAL_CATEGORIES.includes(category) });
  }
  return { countryCode: countryCode.toUpperCase(), currency: catalog.currency, services };
}
