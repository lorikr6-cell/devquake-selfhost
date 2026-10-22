import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { DIETS, DOCUMENT_KINDS, PERSON_KINDS, STATUSES } from '../lib/model';
import { ROLES } from '../lib/roles';
import { appMessages } from './index';

// Every language must have exactly the English texts, with the same {placeholders} (ADR 0011).
const en = appMessages('en');
const keys = messageKeys(en).sort();

function node(messages: Messages, key: string): unknown {
  let n: unknown = messages;
  for (const part of key.split('.')) n = (n as Messages | undefined)?.[part];
  return n;
}

describe('canteen message catalogs', () => {
  it('names every role, kind, status, diet and document', () => {
    for (const r of ROLES) expect(typeof node(en, `roles.${r}`)).toBe('string');
    for (const k of PERSON_KINDS) expect(typeof node(en, `kinds.${k}`)).toBe('string');
    for (const s of STATUSES) expect(typeof node(en, `statuses.${s}`)).toBe('string');
    for (const d of DIETS) expect(typeof node(en, `diets.${d}`)).toBe('string');
    for (const d of DOCUMENT_KINDS) expect(typeof node(en, `documents.${d}`)).toBe('string');
  });

  it('describes every logged access', () => {
    const actions = en.access as Messages;
    for (const kind of DOCUMENT_KINDS.filter((k) => k !== 'photo')) {
      for (const suffix of ['', '_saved', '_deleted']) {
        expect(typeof (actions.actions as Messages)[`document_${kind}${suffix}`]).toBe('string');
      }
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
        const needed = new Intl.PluralRules(locale)
          .resolvedOptions()
          .pluralCategories.filter((form) => form !== 'many');
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
    });
  }
});
