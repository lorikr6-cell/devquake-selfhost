import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders } from '@devquake/ui';
import { appMessages } from './index';

// Every language has exactly the English texts, with the same {placeholders} (ADR 0011).
describe('the catalog', () => {
  const en = appMessages('en');
  const keys = messageKeys(en).sort();
  for (const locale of LOCALES.filter((l) => l !== 'en')) {
    it(`${locale} has every text with the same placeholders`, () => {
      const other = appMessages(locale);
      expect(messageKeys(other).sort()).toEqual(keys);
      for (const key of keys)
        expect(messagePlaceholders(other, key), `${locale} ${key}`).toEqual(
          messagePlaceholders(en, key),
        );
    });
  }
});
