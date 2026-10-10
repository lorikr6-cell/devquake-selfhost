import {
  DEFAULT_LOCALE,
  createTranslator,
  isLocale,
  type Locale,
  type Messages,
  type Translate,
} from '@devquake/ui';
import { cache } from 'react';
import { appTexts } from './app-texts';
import { growth } from './growth';
import { ops } from './ops';
import { screens } from './screens';

// The app's texts in every language (ADR 0011). The host gives each page and API call the
// visitor's language in ctx.locale; the layout hands the catalog to client components.

/** Catalogs merged area by area (several files add to "errors", "shop", "meta"…). */
function merge(a: Messages, b: Messages): Messages {
  const out: Messages = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const prev = out[k];
    out[k] =
      prev && typeof prev === 'object' && v && typeof v === 'object' && !('other' in v)
        ? merge(prev as Messages, v as Messages)
        : v;
  }
  return out;
}

const CATALOGS = Object.fromEntries(
  (Object.keys(screens) as Locale[]).map((l) => [
    l,
    merge(merge(merge(screens[l]!, appTexts[l]!), growth[l]!), ops[l]!),
  ]),
) as Record<Locale, Messages>;

/** Every text of the app in one language (for the layout's I18nProvider). */
export function appMessages(locale: Locale): Messages {
  return CATALOGS[locale];
}

/** The English texts, used for keys a translation lacks. */
export const FALLBACK_MESSAGES = CATALOGS[DEFAULT_LOCALE];

/**
 * The shop's own language for this request (ADR 0058): set by shopScope on a shop's pages
 * when the buyer sees one of the shop's languages, and read by every translator of the same
 * request. React's `cache` keeps it per request; outside a page render it is never set.
 */
const shopLanguage = cache(
  (): { catalog: Messages | null; code: string | null; options: ShopLanguageOption[] } => ({
    catalog: null,
    code: null,
    options: [],
  }),
);

export interface ShopLanguageOption {
  code: string;
  name: string;
}

/**
 * Uses the shop's labels for the rest of this page: `labels` over `base`'s catalog (English for
 * a new language, the built-in one for changes to it). `options` are the shop's own languages.
 */
export function applyShopLanguage(
  code: string | null,
  labels: Messages | null,
  base: Locale,
  options: ShopLanguageOption[],
) {
  const state = shopLanguage();
  state.code = code;
  state.catalog = labels ? merge(CATALOGS[base], labels) : null;
  state.options = options;
}

/** This request's shop language: its code, catalog (null: the built-in one) and the choices. */
export function shopLanguageState() {
  return shopLanguage();
}

/** t('key', params) in `locale`; with `namespace`, keys are relative to it. */
export function translator(locale: Locale, namespace?: string): Translate {
  const catalog = shopLanguage().catalog ?? CATALOGS[locale];
  const t = createTranslator(locale, catalog, FALLBACK_MESSAGES);
  return namespace ? (key, params) => t(`${namespace}.${key}`, params) : t;
}

/** The page language from the plugin context (English when the host does not say). */
export function localeOf(ctx: { locale?: string }): Locale {
  return isLocale(ctx.locale) ? ctx.locale : DEFAULT_LOCALE;
}
