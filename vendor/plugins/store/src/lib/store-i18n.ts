import type { Messages } from '@devquake/ui';

// The shop's own languages (ADR 0058): the owner copies the labels buyers see, translates them
// anywhere (a translator, a colleague, an AI) and pastes them back as a new language ("fr") or
// as changes to a built-in one ("de"). Pure and tested (growth.test.ts).

/** The label groups buyers see in the shop. */
export const SHOP_NAMESPACES = [
  'shop',
  'cart',
  'checkout',
  'orderPage',
  'order',
  'info',
  'methods',
  'status',
  'account',
  'compare',
  'share',
  'reviewsShop',
  'newsletterForm',
  'newsletterPage',
  'cookies',
  'privacy',
  'promo',
  'rules',
  'errors',
  'fields',
] as const;

export const LANGUAGE_CODE = /^[a-z]{2,3}$/;
export const LANGUAGE_LIMITS = { name: 40, label: 2000, bytes: 512 * 1024, languages: 20 } as const;

/** The buyer-facing labels of a catalog, as the JSON the owner copies. */
export function exportLabels(catalog: Messages): string {
  const out: Messages = {};
  for (const ns of SHOP_NAMESPACES) {
    const v = catalog[ns];
    if (v && typeof v === 'object') out[ns] = v;
  }
  return JSON.stringify(out, null, 2);
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join();

export interface ImportResult {
  /** The accepted labels, in the catalog's shape. */
  messages: Messages;
  applied: number;
  /** Labels the paste does not have (the base language shows them). */
  missing: number;
  /** Labels that were changed in a way that would break the shop (keys of them). */
  rejected: string[];
}

/**
 * A pasted translation checked against the base catalog: only known labels, only text, at most
 * LANGUAGE_LIMITS.label characters, and the same {placeholders} as the original (translators
 * sometimes translate them). Plural forms the base does not have are kept (other languages need
 * more forms).
 */
export function importLabels(text: string, base: Messages): ImportResult | null {
  let data: unknown;
  try {
    data = JSON.parse(text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const result: ImportResult = { messages: {}, applied: 0, missing: 0, rejected: [] };

  const walk = (b: Messages, d: unknown, out: Messages, path: string) => {
    const given =
      d && typeof d === 'object' && !Array.isArray(d) ? (d as Record<string, unknown>) : {};
    const plural = 'other' in b && Object.values(b).every((v) => typeof v === 'string');
    for (const [key, value] of Object.entries(b)) {
      const here = path ? `${path}.${key}` : key;
      if (typeof value === 'object') {
        const sub: Messages = {};
        walk(value, given[key], sub, here);
        if (Object.keys(sub).length) out[key] = sub;
        continue;
      }
      const t = given[key];
      if (t === undefined || t === null || t === '') {
        result.missing += 1;
        continue;
      }
      if (
        typeof t !== 'string' ||
        t.length > LANGUAGE_LIMITS.label ||
        placeholders(t) !== placeholders(value)
      ) {
        result.rejected.push(here);
        continue;
      }
      out[key] = t;
      result.applied += 1;
    }
    // More plural forms than the base has (few, many…), with the same placeholders.
    if (plural) {
      for (const form of ['zero', 'two', 'few', 'many'] as const) {
        const t = given[form];
        if (form in b || typeof t !== 'string' || t.length > LANGUAGE_LIMITS.label) continue;
        if (placeholders(t) === placeholders(String(b.other))) out[form] = t;
      }
    }
  };

  for (const ns of SHOP_NAMESPACES) {
    const b = base[ns];
    if (!b || typeof b !== 'object') continue;
    const sub: Messages = {};
    walk(b, (data as Record<string, unknown>)[ns], sub, ns);
    if (Object.keys(sub).length) result.messages[ns] = sub;
  }
  return result;
}

/** How many labels a saved language has (for the owner's list). */
export function countLabels(messages: Messages): number {
  return Object.values(messages).reduce<number>(
    (n, v) => n + (typeof v === 'string' ? 1 : countLabels(v)),
    0,
  );
}
