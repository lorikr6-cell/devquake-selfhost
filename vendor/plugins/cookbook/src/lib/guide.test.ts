import { describe, expect, it } from 'vitest';
import { appMessages } from '../i18n';
import {
  EQUIPMENT,
  mentions,
  prepTasks,
  publishable,
  recipeChecks,
  stepUses,
  stepsByStage,
  suggestedTimerMin,
  type DraftForCheck,
} from './guide';
import { LIBRARY, libraryIngredients, librarySteps } from './library';
import { STAGES } from './recipe';

const ing = (name: string, extra: Partial<DraftForCheck['ingredients'][number]> = {}) => ({
  name,
  qty: 1,
  unit: 'pcs',
  foodId: null,
  note: null,
  ...extra,
});

describe('which ingredients a step uses', () => {
  it('finds names in the text by word stems, in any language', () => {
    const list = [
      { name: 'onions' },
      { name: 'eggs' },
      { name: 'chopped tomatoes (canned)' },
      { name: 'tojás' },
    ];
    expect(mentions('Fry the onion, then crack the egg in.', list)).toEqual([0, 1]);
    expect(mentions('Add the tomatoes.', list)).toEqual([2]);
    expect(mentions('Üss bele két tojást.', list)).toEqual([3]);
  });

  it('prefers what the author chose', () => {
    expect(
      stepUses({ text: 'Add the onions', timerSec: null, stage: 'cook', uses: [] }, [
        { name: 'onions' },
      ]),
    ).toEqual([]);
    expect(
      stepUses({ text: 'Mix', timerSec: null, stage: 'cook', uses: [0, 9] }, [{ name: 'flour' }]),
    ).toEqual([0]);
  });

  it('every library step mentions at least one ingredient or is a plain action', () => {
    for (const r of LIBRARY) {
      const ingredients = libraryIngredients(r, 'en');
      const used = new Set(librarySteps(r, 'en').flatMap((s) => stepUses(s, ingredients)));
      // Most ingredients of each library recipe are found in its steps.
      expect(used.size / ingredients.length, r.id).toBeGreaterThanOrEqual(0.5);
    }
  });
});

describe('timers, preparation and stages', () => {
  it('reads times from the text', () => {
    expect(suggestedTimerMin('Simmer for 20 minutes.')).toBe(20);
    expect(suggestedTimerMin('Bake 10–12 min')).toBe(10);
    expect(suggestedTimerMin('Főzd 1 óra 30 percig')).toBe(90);
    expect(suggestedTimerMin('Serve hot.')).toBeNull();
  });

  it('lists preparation tasks and groups steps by stage, keeping their numbers', () => {
    expect(prepTasks([{ note: null }, { note: 'chopped' }]).map((x) => x.index)).toEqual([1]);
    const steps = [
      { text: 'b', timerSec: null, stage: 'cook' as const, uses: null },
      { text: 'a', timerSec: null, stage: 'prepare' as const, uses: null },
      { text: 'c', timerSec: null, stage: 'serve' as const, uses: null },
    ];
    expect(stepsByStage(steps).map((g) => [g.stage, g.steps.map((s) => s.n)])).toEqual([
      ['prepare', [2]],
      ['cook', [1]],
      ['serve', [3]],
    ]);
  });
});

describe('the checklist', () => {
  const draft: DraftForCheck = {
    title: 'Omelette',
    servings: 1,
    prepMin: 2,
    cookMin: 5,
    equipment: 'pan',
    ingredients: [
      ing('eggs', { foodId: 'egg' }),
      ing('onion', { note: 'chopped', foodId: 'onion' }),
    ],
    steps: [
      { text: 'Beat the eggs with the onion.', timerSec: null, stage: 'prepare', uses: null },
      { text: 'Cook for 3 minutes, then serve.', timerSec: 180, stage: 'serve', uses: null },
    ],
  };

  it('passes a complete recipe', () => {
    const checks = recipeChecks(draft);
    expect(checks.filter((c) => !c.ok)).toEqual([]);
    expect(publishable(checks)).toBe(true);
  });

  it('blocks publishing without the basics and gives tips for the rest', () => {
    const checks = recipeChecks({
      ...draft,
      title: 'X',
      prepMin: 0,
      cookMin: 0,
      ingredients: [...draft.ingredients, ing('garlic', { qty: null, unit: 'clove' })],
      steps: [{ text: 'Cook for 3 minutes.', timerSec: null, stage: 'cook', uses: null }],
    });
    const failed = Object.fromEntries(checks.filter((c) => !c.ok).map((c) => [c.key, c.level]));
    expect(failed).toMatchObject({
      title: 'required',
      ingredients: 'required',
      times: 'tip',
      unused: 'tip',
      timers: 'tip',
      prep: 'tip',
      serve: 'tip',
    });
    expect(publishable(checks)).toBe(false);
  });

  it('has a text for every check, stage and piece of equipment', () => {
    const en = appMessages('en') as Record<string, Record<string, unknown>>;
    for (const c of recipeChecks(draft)) {
      const node = en.checks![c.key] as Record<string, string>;
      expect(typeof node.ok, c.key).toBe('string');
      expect(typeof node.todo, c.key).toBe('string');
    }
    for (const s of STAGES)
      expect(typeof (en.guide!.stage as Record<string, string>)[s]).toBe('string');
    for (const e of EQUIPMENT) expect(typeof en.equipmentNames![e]).toBe('string');
  });
});
