// Store type catalogue (no imports: used by pages, client components and the API).
// Codes are stored in the database; labels, descriptions and known chains can change freely.

export interface StoreType {
  code: string;
  label: string;
  /** English category name; `group` is its key in the translations (storeCategories). */
  category: string;
  group: string;
  /** English texts; the screens show the translations (storeTypes.<code>). */
  description: string;
}

export const STORE_TYPES: StoreType[] = [
  {
    code: 'grocery',
    label: 'Grocery store / supermarket',
    category: 'Food and daily essentials',
    group: 'food',
    description: 'Fresh produce, packaged food, drinks and household cleaning supplies.',
  },
  {
    code: 'convenience',
    label: 'Convenience store',
    category: 'Food and daily essentials',
    group: 'food',
    description: 'Neighbourhood shop for snacks, drinks and basics, with long opening hours.',
  },
  {
    code: 'specialty_food',
    label: 'Specialty food market',
    category: 'Food and daily essentials',
    group: 'food',
    description: 'Bakery, butcher, cheese or other specialised food shop.',
  },
  {
    code: 'hardware_diy',
    label: 'Hardware and DIY store',
    category: 'Home improvement and tools',
    group: 'home',
    description: 'Tools, building materials, plumbing supplies and paint.',
  },
  {
    code: 'garden',
    label: 'Garden centre',
    category: 'Home improvement and tools',
    group: 'home',
    description: 'Plants, soil, gardening tools and outdoor equipment.',
  },
  {
    code: 'electronics',
    label: 'Consumer electronics',
    category: 'Electronics and appliances',
    group: 'electronics',
    description: 'Computers, TVs, phones, audio and gaming.',
  },
  {
    code: 'appliances',
    label: 'Major appliances',
    category: 'Electronics and appliances',
    group: 'electronics',
    description: 'Fridges, washing machines, stoves and other large appliances.',
  },
  {
    code: 'fashion',
    label: 'Clothing and fashion',
    category: 'Apparel and lifestyle',
    group: 'apparel',
    description: 'Clothes, shoes and accessories.',
  },
  {
    code: 'department',
    label: 'Department store',
    category: 'Apparel and lifestyle',
    group: 'apparel',
    description: 'Large store with clothing, cosmetics, home goods and accessories.',
  },
  {
    code: 'pharmacy',
    label: 'Pharmacy / drugstore',
    category: 'Health and personal care',
    group: 'health',
    description: 'Medicines, vitamins and personal hygiene products.',
  },
  {
    code: 'beauty',
    label: 'Cosmetics and beauty',
    category: 'Health and personal care',
    group: 'health',
    description: 'Make-up, skincare, perfume and hair care.',
  },
  {
    code: 'other',
    label: 'Other',
    category: 'Other',
    group: 'other',
    description: 'Any other kind of shop.',
  },
];

const BY_CODE = new Map(STORE_TYPES.map((t) => [t.code, t]));

export function storeType(code: string | null | undefined): StoreType {
  return (code && BY_CODE.get(code)) || BY_CODE.get('other')!;
}

export function isStoreType(code: unknown): code is string {
  return typeof code === 'string' && BY_CODE.has(code);
}

/** Store types grouped by category, in catalogue order (for <optgroup>s). */
export function storeTypesByCategory(): Array<{
  category: string;
  group: string;
  types: StoreType[];
}> {
  const groups = new Map<string, StoreType[]>();
  for (const t of STORE_TYPES) groups.set(t.group, [...(groups.get(t.group) ?? []), t]);
  return [...groups].map(([group, types]) => ({ category: types[0]!.category, group, types }));
}

/** Well-known chains (Romania first) → store type, used to fill in the type automatically. */
export const KNOWN_STORES: Array<{ name: string; type: string }> = [
  { name: 'Kaufland', type: 'grocery' },
  { name: 'Profi', type: 'grocery' },
  { name: 'Lidl', type: 'grocery' },
  { name: 'Carrefour', type: 'grocery' },
  { name: 'Auchan', type: 'grocery' },
  { name: 'Mega Image', type: 'grocery' },
  { name: 'Penny', type: 'grocery' },
  { name: 'Selgros', type: 'grocery' },
  { name: 'Metro', type: 'grocery' },
  { name: 'La Doi Pași', type: 'convenience' },
  { name: 'Leroy Merlin', type: 'hardware_diy' },
  { name: 'Dedeman', type: 'hardware_diy' },
  { name: 'Hornbach', type: 'hardware_diy' },
  { name: 'Brico Depôt', type: 'hardware_diy' },
  { name: 'Altex', type: 'electronics' },
  { name: 'Flanco', type: 'electronics' },
  { name: 'eMAG', type: 'electronics' },
  { name: 'Media Galaxy', type: 'electronics' },
  { name: 'IKEA', type: 'department' },
  { name: 'Catena', type: 'pharmacy' },
  { name: 'Sensiblu', type: 'pharmacy' },
  { name: 'Help Net', type: 'pharmacy' },
  { name: 'dm', type: 'pharmacy' },
  { name: 'Sephora', type: 'beauty' },
  { name: 'Douglas', type: 'beauty' },
  { name: 'Notino', type: 'beauty' },
  { name: 'Zara', type: 'fashion' },
  { name: 'H&M', type: 'fashion' },
];

/** Store type for a typed store name ("kaufland iulius" → grocery), or null if unknown. */
export function guessStoreType(name: string): string | null {
  const n = name.trim().toLocaleLowerCase('ro');
  if (!n) return null;
  const hit = KNOWN_STORES.find((s) => {
    const k = s.name.toLocaleLowerCase('ro');
    return n === k || n.startsWith(`${k} `);
  });
  return hit?.type ?? null;
}
