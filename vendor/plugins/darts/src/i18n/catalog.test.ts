import { describe, expect, it } from 'vitest';
import { LOCALES, messageKeys, messagePlaceholders, type Messages } from '@devquake/ui';
import { play, preview } from '../lib/engine/engine';
import { GAME_TYPES, X01_STARTS, normalizeOptions } from '../lib/engine/games';
import { suggestions } from '../lib/engine/suggest';
import { SKILLS } from '../lib/stats';
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

describe('darts message catalogs', () => {
  it('names and explains every game, skill and drill', () => {
    for (const g of GAME_TYPES) {
      for (const area of ['games.names', 'games.short', 'games.rules', 'drills.titles']) {
        expect(typeof node(en, `${area}.${g}`), `${area}.${g}`).toBe('string');
      }
    }
    for (const s of [...SKILLS, 'starter']) {
      expect(typeof node(en, `skills.${s}`)).toBe('string');
      expect(typeof node(en, `drills.why.${s}`)).toBe('string');
    }
  });

  it('explains what every game option means', () => {
    const keys = [
      ...X01_STARTS.map((v) => `start.${v}`),
      'in.straight',
      'in.double',
      'out.double',
      'out.single',
      'out.master',
      'legs',
      'variant.standard',
      'variant.cutthroat',
      'shanghaiRounds.7',
      'shanghaiRounds.20',
      'hit.any',
      'hit.doubles',
      'lives',
      'countupRounds',
      'dartsPerFinish',
      'dartsPerTarget',
      'targets',
      ...[0, 1, 2, 3].map((m) => `ring.${m}`),
    ];
    for (const k of keys) expect(node(en, `games.options.help.${k}`), k).toBeDefined();
  });

  it('explains every suggestion, with every value its sentence uses', () => {
    const seats = [
      { id: 1, name: 'A', number: 5 },
      { id: 2, name: 'B', number: 17 },
    ];
    const states = GAME_TYPES.flatMap((type) => {
      const setup = { type, options: normalizeOptions(type, {}), seats };
      const solo = { ...setup, seats: [seats[0]!] };
      // After a first visit (where the rules allow three treble 20s).
      let opened: ReturnType<typeof play> | null = null;
      try {
        opened = play(setup, [
          {
            playerId: 1,
            darts: [
              { n: 20, m: 3 },
              { n: 20, m: 3 },
              { n: 20, m: 3 },
            ],
          },
        ]);
      } catch {
        opened = null;
      }
      return [play(solo, []), play(setup, []), ...(opened ? [opened] : [])].filter(
        (s) => !s.finished,
      );
    });
    // Close to a finish and far from one, with darts already thrown.
    const x01 = play({ type: 'x01', options: normalizeOptions('x01', { start: 101 }), seats }, []);
    const hints = [
      ...states.flatMap((s) => suggestions(s)),
      ...suggestions(x01),
      ...suggestions(
        preview(x01, [
          { n: 1, m: 1 },
          { n: 1, m: 1 },
        ]).state,
        [
          { n: 1, m: 1 },
          { n: 1, m: 1 },
        ],
      ),
      ...suggestions(
        play({ type: 'x01', options: normalizeOptions('x01', { in: 'double' }), seats }, []),
      ),
    ];
    expect(hints.length).toBeGreaterThan(10);
    for (const h of hints) {
      const key = `suggest.explain.${h.why}`;
      expect(node(en, key), key).toBeDefined();
      for (const name of messagePlaceholders(en, key)) {
        expect(h.params ?? {}, `${key} needs {${name}}`).toHaveProperty(name);
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
