import type { Locale, Messages, MessagesOf } from '@devquake/ui';

/**
 * One area's texts in every language (ADR 0011). English is the source; the type makes the
 * other languages provide exactly the same keys (tests also compare the {placeholders}).
 */
export function defineMessages<T extends Messages>(
  en: T,
  translations: Record<Exclude<Locale, 'en'>, MessagesOf<T>>,
): Record<Locale, Messages> {
  return { en, ...translations };
}
