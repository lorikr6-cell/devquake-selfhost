// Languages (ADR 0011): the locale list, URL prefixes and a small message translator. Pure: used
// by the host's proxy and server code, by plugins and by the client components in i18n-react.

export const LOCALES = ['en', 'de', 'ro', 'hu'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Each language's own name, as shown in the picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  ro: 'Română',
  hu: 'Magyar',
};

/** BCP 47 tags for Intl (dates, numbers, plurals). */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-GB',
  de: 'de-DE',
  ro: 'ro-RO',
  hu: 'hu-HU',
};

/** Cookie with the visitor's language, shared by devquake.com and every app (1 year). */
export const LOCALE_COOKIE = 'dq_lang';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * The best supported language for an Accept-Language header ("de-AT,de;q=0.9,en;q=0.8" → de),
 * or English when none of them is supported.
 */
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const wanted = header
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return {
        base: tag.trim().toLowerCase().split('-')[0] ?? '',
        q: q ? Number(q.slice(2)) : 1,
        index,
      };
    })
    .filter((w) => w.base && w.base !== '*' && w.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return wanted.map((w) => w.base).find(isLocale) ?? DEFAULT_LOCALE;
}

/** "/de/ideas/4" → { locale: 'de', path: '/ideas/4' }; paths without a prefix are English. */
export function stripLocale(pathname: string): { locale: Locale | null; path: string } {
  const match = pathname.match(/^\/([a-z]{2})(?=\/|$)(.*)$/);
  if (match && isLocale(match[1])) return { locale: match[1], path: match[2] || '/' };
  return { locale: null, path: pathname || '/' };
}

// Paths that never carry a language prefix: APIs, the control panel and generated files.
const UNPREFIXED = /^\/(api|admin-cp|_next|plugin-host|plugin-api)(\/|$)/;

/**
 * The URL of a root-relative path in a language: English has no prefix, the others do
 * ("/ideas", 'de' → "/de/ideas"). Absolute URLs, anchors, APIs and /admin-cp are unchanged.
 */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith('/') || path.startsWith('//') || UNPREFIXED.test(path)) return path;
  const { path: bare } = stripLocale(path);
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === '/'
    ? `/${locale}`
    : bare.startsWith('/?') || bare.startsWith('/#')
      ? `/${locale}${bare.slice(1)}`
      : `/${locale}${bare}`;
}

// ---- messages -------------------------------------------------------------------------------

/**
 * A message catalog: nested objects of strings. A plural message is an object with
 * Intl.PluralRules categories ({ one: '{count} item', other: '{count} items' }).
 */
export interface Messages {
  [key: string]: string | Messages;
}

/** The same keys as `T`, every leaf a string: the type translations must satisfy. */
export type MessagesOf<T> = {
  [K in keyof T]: T[K] extends string ? string : MessagesOf<T[K]> & Messages;
};

export type TranslateParams = Record<string, string | number>;
export type Translate = (key: string, params?: TranslateParams) => string;

const PLURAL_KEYS = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

function lookup(messages: Messages, key: string): string | Messages | undefined {
  let node: string | Messages | undefined = messages;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }
  return node;
}

function isPlural(node: Messages): boolean {
  const keys = Object.keys(node);
  return keys.includes('other') && keys.every((k) => PLURAL_KEYS.has(k));
}

/**
 * t('ideas.title'), t('list.items', { count: 3 }): the message in `messages`, else in
 * `fallback` (English), else the key itself (so a missing text is visible, not blank).
 */
export function createTranslator(
  locale: Locale,
  messages: Messages,
  fallback?: Messages,
): Translate {
  const rules = new Intl.PluralRules(LOCALE_TAGS[locale]);
  return (key, params) => {
    let node = lookup(messages, key);
    if (node === undefined && fallback) node = lookup(fallback, key);
    if (node === undefined) return key;
    let text: string;
    if (typeof node === 'string') text = node;
    else if (isPlural(node)) {
      const count = Number(params?.count ?? 0);
      const form = node[rules.select(count)] ?? node.other;
      text = typeof form === 'string' ? form : key;
    } else return key;
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (all, name: string) => {
      const value = params[name];
      // Numbers as they are ("2026", not "2.026"); format them before passing when needed.
      return value === undefined ? all : String(value);
    });
  };
}

/** Every key of a catalog ("a.b.c"; plural messages count as one key). For tests. */
export function messageKeys(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string' || isPlural(v)) return [key];
    return messageKeys(v, key);
  });
}

/** The {placeholders} a message uses (all plural forms together), sorted. For tests. */
export function messagePlaceholders(messages: Messages, key: string): string[] {
  const node = lookup(messages, key);
  const texts = typeof node === 'string' ? [node] : node ? Object.values(node) : [];
  const names = new Set<string>();
  for (const text of texts) {
    if (typeof text === 'string') for (const m of text.matchAll(/\{(\w+)\}/g)) names.add(m[1]!);
  }
  return [...names].sort();
}
