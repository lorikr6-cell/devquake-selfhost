import {
  DEFAULT_LOCALE,
  createTranslator,
  isLocale,
  type Locale,
  type Messages,
  type Translate,
} from '@devquake/ui';
import { appTexts } from './app-texts';
import { copyTexts } from './copy';
import { screens } from './screens';

// The app's texts in every language (ADR 0011). The host gives each page and API call the
// visitor's language in ctx.locale; the layout hands the catalog to client components.

const CATALOGS = Object.fromEntries(
  (Object.keys(screens) as Locale[]).map((l) => [
    l,
    { ...screens[l], ...appTexts[l], ...copyTexts[l] },
  ]),
) as Record<Locale, Messages>;

/** Every text of the app in one language (for the layout's I18nProvider). */
export function appMessages(locale: Locale): Messages {
  return CATALOGS[locale];
}

/** The English texts, used for keys a translation lacks. */
export const FALLBACK_MESSAGES = CATALOGS[DEFAULT_LOCALE];

/** t('key', params) in `locale`; with `namespace`, keys are relative to it. */
export function translator(locale: Locale, namespace?: string): Translate {
  const t = createTranslator(locale, CATALOGS[locale], FALLBACK_MESSAGES);
  return namespace ? (key, params) => t(`${namespace}.${key}`, params) : t;
}

/** The page language from the plugin context (English when the host does not say). */
export function localeOf(ctx: { locale?: string }): Locale {
  return isLocale(ctx.locale) ? ctx.locale : DEFAULT_LOCALE;
}
