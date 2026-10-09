import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { PROBLEM_CODES } from '../lib/envelope';
import { API_MESSAGES } from '../lib/gateway';
import { LIMITS, SHOWN_LIMITS } from '../lib/limits';
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

describe('pulse message catalogs', () => {
  it('has a text for every API error code and every plan', () => {
    for (const code of [...Object.keys(API_MESSAGES), ...PROBLEM_CODES]) {
      expect(node(en, `apiErrors.${code}`), code).toBeDefined();
    }
    for (const plan of Object.keys(LIMITS)) {
      expect(typeof node(en, `plan.names.${plan}`)).toBe('string');
      expect(typeof node(en, `plan.about.${plan}`)).toBe('string');
    }
    for (const key of SHOWN_LIMITS.filter(
      (k) => k !== 'deliveryDelayMs' && k !== 'historyMinutes',
    )) {
      expect(node(en, `plan.limits.${key}`), key).toBeDefined();
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

      it('has the manual with the same sections and blocks as English', () => {
        const shape = (m: typeof MANUAL.en) =>
          m.sections.map((s) => `${s.id}:${s.blocks.map(blockShape).join(',')}`);
        expect(shape(MANUAL[locale])).toEqual(shape(MANUAL.en));
        expect(MANUAL[locale].cta).toContain('{link}');
        expect(MANUAL[locale].questions).toContain('{email}');
        const count = (m: typeof MANUAL.en, p: string) => JSON.stringify(m).split(p).length;
        expect(count(MANUAL[locale], '{host}')).toBe(count(MANUAL.en, '{host}'));
        expect(count(MANUAL[locale], '{contact}')).toBe(count(MANUAL.en, '{contact}'));
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
