import { describe, expect, it } from 'vitest';
import { MANUAL, type ManualBlock } from './manual';

const shapeOf = (b: ManualBlock) =>
  'steps' in b
    ? `steps:${b.steps.length}`
    : 'list' in b
      ? `list:${b.list.length}`
      : Object.keys(b)[0];
const shape = (m: typeof MANUAL.en) =>
  m.sections.map((s) => `${s.id}:${s.blocks.map(shapeOf).join(',')}`);

describe('user manual', () => {
  for (const locale of Object.keys(MANUAL) as (keyof typeof MANUAL)[]) {
    it(`has the same sections and blocks in ${locale} as in English`, () => {
      const m = MANUAL[locale];
      expect(shape(m)).toEqual(shape(MANUAL.en));
      expect(m.cta).toContain('{link}');
      expect(m.questions).toContain('{email}');
      expect(JSON.stringify(m).split('{host}').length).toBe(
        JSON.stringify(MANUAL.en).split('{host}').length,
      );
    });
  }
});
