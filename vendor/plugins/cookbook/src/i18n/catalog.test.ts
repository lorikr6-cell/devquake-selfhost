import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { ALLERGENS, NUTRIENTS } from '../lib/foods';
import { DIFFICULTIES, SCALINGS, TAGS, UNITS } from '../lib/recipe';
import { MANUAL, type ManualBlock } from './manual';
import { appMessages } from './index';

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

describe('cookbook message catalogs', () => {
  it('names every tag (with the reasons), allergen, unit, scaling, difficulty and nutrient', () => {
    for (const x of TAGS) expect(typeof node(en, `tags.${x}`)).toBe('string');
    for (const x of ['highProtein', 'lowerCarb', 'quick'])
      expect(typeof node(en, `tagWhy.${x}`)).toBe('string');
    for (const x of ALLERGENS) expect(typeof node(en, `allergens.${x}`)).toBe('string');
    for (const x of [...UNITS, 'oz', 'lb', 'floz', 'qt'])
      expect(typeof node(en, `units.${x}`)).toBe('string');
    for (const x of SCALINGS) expect(typeof node(en, `scalings.${x}`)).toBe('string');
    for (const x of DIFFICULTIES) expect(typeof node(en, `difficulty.${x}`)).toBe('string');
    for (const x of NUTRIENTS) expect(typeof node(en, `nutrients.${x}`)).toBe('string');
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

      it('has the manual with the same sections and blocks as English', () => {
        const shape = (m: typeof MANUAL.en) =>
          m.sections.map((s) => `${s.id}:${s.blocks.map(blockShape).join(',')}`);
        expect(shape(MANUAL[locale])).toEqual(shape(MANUAL.en));
        expect(MANUAL[locale].cta).toContain('{link}');
        expect(MANUAL[locale].questions).toContain('{email}');
        const hostLinks = (m: typeof MANUAL.en) => JSON.stringify(m).split('{host}').length;
        expect(hostLinks(MANUAL[locale])).toBe(hostLinks(MANUAL.en));
      });

      it('has no empty texts', () => {
        const empty = keys.filter((key) => {
          const value = node(messages, key);
          return typeof value === 'string' && value.trim() === '';
        });
        expect(empty).toEqual([]);
      });
    });
  }
});
