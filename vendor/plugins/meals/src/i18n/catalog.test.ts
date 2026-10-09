import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { ALLERGENS, DIETS, PORTIONS, SLOTS } from '../lib/plan';
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

describe('meals message catalogs', () => {
  it('names every slot, diet, allergen, portion and role', () => {
    for (const x of SLOTS) expect(typeof node(en, `slots.${x.code}`)).toBe('string');
    for (const x of DIETS) expect(typeof node(en, `diets.${x}`)).toBe('string');
    for (const x of ALLERGENS) expect(typeof node(en, `allergens.${x}`)).toBe('string');
    for (const x of PORTIONS)
      expect(typeof node(en, `portions.${String(x).replace('.', '_')}`)).toBe('string');
    for (const x of ['planner', 'member']) expect(typeof node(en, `roles.${x}`)).toBe('string');
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
