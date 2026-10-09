import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { STORE_TYPES } from '../lib/store-types';
import { appMessages } from './index';
import { MANUAL, type ManualBlock } from './manual';

// Every language must have exactly the English texts, with the same {placeholders} (ADR 0011).
const en = appMessages('en');
const keys = messageKeys(en).sort();

function node(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((n, k) => (n as Messages | undefined)?.[k], messages);
}

const blockShape = (b: ManualBlock) =>
  'steps' in b
    ? `steps:${b.steps.length}`
    : 'list' in b
      ? `list:${b.list.length}`
      : Object.keys(b)[0];

describe('shopping message catalogs', () => {
  it('names every store type and category', () => {
    for (const type of STORE_TYPES) {
      expect(node(en, `storeTypes.${type.code}.label`)).toBe(type.label);
      expect(node(en, `storeCategories.${type.group}`)).toBe(type.category);
    }
  });

  for (const locale of LOCALES.filter((l) => l !== 'en')) {
    describe(locale, () => {
      const messages = appMessages(locale);

      it('has the same keys as English', () => {
        expect(messageKeys(messages).sort()).toEqual(keys);
      });

      it('uses the same placeholders as English', () => {
        const wrong = keys.filter(
          (key) =>
            messagePlaceholders(messages, key).join() !== messagePlaceholders(en, key).join(),
        );
        expect(wrong).toEqual([]);
      });

      it('gives every plural the forms this language needs', () => {
        const needed = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
        const missing = keys.filter((key) => {
          const value = node(messages, key);
          if (typeof value === 'string') return false;
          return needed.some((form) => !(form in (value as object)));
        });
        expect(missing).toEqual([]);
      });

      it('has no empty texts', () => {
        const empty = keys.filter((key) => {
          const value = node(messages, key);
          return typeof value === 'string' && value.trim() === '';
        });
        expect(empty).toEqual([]);
      });

      it('has the same units list length as English', () => {
        expect(String(node(messages, 'list.units')).split('|')).toHaveLength(
          String(node(en, 'list.units')).split('|').length,
        );
      });

      it('has the manual with the same sections and blocks as English', () => {
        const shape = (m: typeof MANUAL.en) =>
          m.sections.map((s) => `${s.id}:${s.blocks.map(blockShape).join(',')}`);
        expect(shape(MANUAL[locale])).toEqual(shape(MANUAL.en));
        expect(MANUAL[locale].cta).toContain('{link}');
        expect(MANUAL[locale].questions).toContain('{email}');
        const hostLinks = (m: typeof MANUAL.en) => JSON.stringify(m).split('{host}').length;
        expect(hostLinks(MANUAL[locale])).toBe(hostLinks(MANUAL.en));
      });
    });
  }
});
