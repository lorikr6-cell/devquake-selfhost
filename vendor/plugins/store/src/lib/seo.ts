// Search engine texts and the owner's SEO checklist (ADR 0058). Pure and tested (seo.test.ts).

export const SEO_LIMITS = { title: 70, description: 170 } as const;

/** Lengths search engines show in full (beyond them the snippet is cut). */
export const IDEAL = {
  titleMin: 15,
  titleMax: 60,
  descriptionMin: 70,
  descriptionMax: 160,
  bodyMin: 120,
} as const;

/** Text shortened at a word for a snippet ("…" added). */
export function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:-]+$/, '')}…`;
}

export interface SeoStore {
  name: string;
  tagline: string | null;
  about: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface SeoProduct {
  name: string;
  summary: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

/** The shop's title and description as search engines get them. */
export function storeMeta(s: SeoStore): { title: string; description: string } {
  return {
    title: s.seoTitle ?? (s.tagline ? `${s.name} · ${s.tagline}` : s.name),
    description: clip(s.seoDescription ?? s.about ?? s.tagline ?? s.name, IDEAL.descriptionMax),
  };
}

/** A product's title and description as search engines get them. */
export function productMeta(
  p: SeoProduct,
  storeName: string,
): { title: string; description: string } {
  return {
    title: p.seoTitle ?? `${p.name} · ${storeName}`,
    description: clip(
      p.seoDescription ?? p.summary ?? p.description ?? p.name,
      IDEAL.descriptionMax,
    ),
  };
}

export const PRODUCT_CHECKS = [
  'draft',
  'noPhoto',
  'fewPhotos',
  'titleShort',
  'titleLong',
  'descriptionShort',
  'descriptionLong',
  'bodyShort',
  'noCategory',
  'noBrand',
  'noGtin',
] as const;
export type ProductCheck = (typeof PRODUCT_CHECKS)[number];

/** Serious problems cost more than hints. */
const WEIGHT: Record<ProductCheck, number> = {
  draft: 0,
  noPhoto: 30,
  fewPhotos: 5,
  titleShort: 10,
  titleLong: 10,
  descriptionShort: 15,
  descriptionLong: 5,
  bodyShort: 15,
  noCategory: 5,
  noBrand: 5,
  noGtin: 0,
};

export function productChecks(
  p: SeoProduct & {
    published: boolean;
    photos: number;
    category: string | null;
    brand: string | null;
    gtin: string | null;
  },
  storeName: string,
): { score: number; issues: ProductCheck[] } {
  const meta = productMeta(p, storeName);
  const issues: ProductCheck[] = [];
  if (!p.published) issues.push('draft');
  if (p.photos === 0) issues.push('noPhoto');
  else if (p.photos < 3) issues.push('fewPhotos');
  if (meta.title.length < IDEAL.titleMin) issues.push('titleShort');
  if (meta.title.length > IDEAL.titleMax) issues.push('titleLong');
  const description = p.seoDescription ?? p.summary ?? p.description ?? '';
  if (description.length < IDEAL.descriptionMin) issues.push('descriptionShort');
  if (description.length > IDEAL.descriptionMax) issues.push('descriptionLong');
  if ((p.description ?? '').length < IDEAL.bodyMin) issues.push('bodyShort');
  if (!p.category) issues.push('noCategory');
  if (!p.brand) issues.push('noBrand');
  if (!p.gtin) issues.push('noGtin');
  const score = Math.max(0, 100 - issues.reduce((s, i) => s + WEIGHT[i], 0));
  return { score, issues };
}

export const STORE_CHECKS = [
  'closed',
  'noDescription',
  'noLogo',
  'noBanner',
  'noSeller',
  'noProducts',
] as const;
export type StoreCheck = (typeof STORE_CHECKS)[number];

export function storeChecks(s: {
  published: boolean;
  description: string;
  hasLogo: boolean;
  hasBanner: boolean;
  hasSeller: boolean;
  publishedProducts: number;
}): StoreCheck[] {
  const out: StoreCheck[] = [];
  if (!s.published) out.push('closed');
  if (s.description.length < IDEAL.descriptionMin) out.push('noDescription');
  if (!s.hasLogo) out.push('noLogo');
  if (!s.hasBanner) out.push('noBanner');
  if (!s.hasSeller) out.push('noSeller');
  if (s.publishedProducts === 0) out.push('noProducts');
  return out;
}

/** GTIN-8, -12, -13 or -14 with a valid check digit (barcodes: EAN, UPC). */
export function isGtin(value: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(value)) return false;
  const digits = value.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
