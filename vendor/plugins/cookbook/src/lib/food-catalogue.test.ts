import type { PluginDatabase } from '@devquake/plugin-sdk';
import { afterEach, describe, expect, it } from 'vitest';
import { FOOD_ICONS, isFoodIcon, isHexColour } from './food-icons';
import { foodIdInput, foodInput } from './food-input';
import { FOOD_COLUMNS, foodFromRow, loadFoods, rowValues, type FoodRow } from './food-store';
import {
  FOODS,
  FOOD_KINDS,
  WEIGHED_UNITS,
  foodById,
  searchFoods,
  setFoodCatalogue,
  thumbOf,
  thumbsOf,
  type Food,
} from './foods';
import { HttpError } from './http';

const rowOf = (f: Food) =>
  Object.fromEntries(FOOD_COLUMNS.map((c, i) => [c, rowValues(f)[i]])) as unknown as FoodRow;

afterEach(() => setFoodCatalogue([]));

describe('the built-in foods', () => {
  it('have a kind, a known thumbnail and valid colours and units', () => {
    expect(FOODS.length).toBeGreaterThan(180);
    for (const f of FOODS) {
      expect(FOOD_KINDS, f.id).toContain(f.kind);
      expect(isFoodIcon(f.icon), f.id).toBe(true);
      if (f.colour !== undefined) expect(isHexColour(f.colour), f.id).toBe(true);
      for (const u of Object.keys(f.grams ?? {})) expect(WEIGHED_UNITS, f.id).toContain(u);
    }
  });

  it('cover herbs, spices, fruit and vegetables', () => {
    for (const kind of ['herb', 'spice', 'fruit', 'vegetable'] as const) {
      expect(FOODS.filter((f) => f.kind === kind).length, kind).toBeGreaterThanOrEqual(10);
    }
  });

  it('give every thumbnail a default colour', () => {
    for (const colour of Object.values(FOOD_ICONS)) expect(isHexColour(colour)).toBe(true);
  });
});

describe('database rows', () => {
  it('read back exactly what was written', () => {
    for (const f of FOODS) expect(foodFromRow(rowOf(f)), f.id).toEqual(f);
  });

  it('skip rows with an unknown kind or thumbnail', () => {
    const egg = rowOf(foodById('egg')!);
    expect(foodFromRow({ ...egg, kind: 'rock' })).toBeNull();
    expect(foodFromRow({ ...egg, icon: 'rocket' })).toBeNull();
  });
});

describe('the catalogue', () => {
  it('uses the database values and keeps built-in foods the table lacks', () => {
    const egg = foodById('egg')!;
    const quail: Food = { ...egg, id: 'quail-eggs', name: { ...egg.name, en: 'quail eggs' } };
    setFoodCatalogue([{ ...egg, name: { ...egg.name, en: 'hen eggs' } }, quail]);
    expect(foodById('egg')?.name.en).toBe('hen eggs');
    expect(foodById('quail-eggs')?.name.en).toBe('quail eggs');
    expect(foodById('tomato')).toBeDefined();
  });

  it('stops offering switched-off foods but still knows them', () => {
    setFoodCatalogue([{ ...foodById('tomato')!, active: false }]);
    expect(searchFoods('tomatoes', 'en').map((f) => f.id)).not.toContain('tomato');
    expect(foodById('tomato')?.active).toBe(false);
  });

  it('shows the viewer’s own picture first, then the chosen one, then the drawing', () => {
    const egg = foodById('egg')!;
    expect(thumbOf(egg)).toEqual({ icon: 'egg' });
    setFoodCatalogue([{ ...egg, photo: 42 }]);
    expect(thumbOf(foodById('egg')!)).toEqual({ icon: 'egg', photo: '/api/food-photos/42?v=1' });
    expect(thumbOf(foodById('egg')!, { egg: '/api/food-photos/7?v=99' })).toEqual({
      icon: 'egg',
      photo: '/api/food-photos/7?v=99',
      mine: true,
    });
  });

  it('reads the chosen picture from the table', () => {
    const egg = foodById('egg')!;
    expect(foodFromRow({ ...rowOf(egg), photo_id: '42' })?.photo).toBe(42);
    expect(foodFromRow({ ...rowOf(egg), photo_id: null })?.photo).toBeUndefined();
  });

  it('gives the thumbnails of a recipe’s foods', () => {
    expect(thumbsOf([{ foodId: 'egg' }, { foodId: null }, { foodId: 'nope' }])).toEqual({
      egg: { icon: 'egg' },
    });
  });
});

describe('loading from the database', () => {
  function fakeDb(rows: FoodRow[], fail = false) {
    const inserted: unknown[][] = [];
    const db = {
      query: async () => {
        if (fail) throw new Error('no table');
        return [...rows];
      },
      execute: async (_sql: string, params: unknown[] = []) => {
        inserted.push(params);
        rows.push(
          Object.fromEntries(FOOD_COLUMNS.map((c, i) => [c, params[i]])) as unknown as FoodRow,
        );
        return { affectedRows: 1, insertId: 0 };
      },
      transaction: async () => undefined,
    } as unknown as PluginDatabase;
    return { db, inserted };
  }

  it('adds the missing built-in foods once, then uses the table', async () => {
    const egg = foodById('egg')!;
    const { db, inserted } = fakeDb([rowOf({ ...egg, name: { ...egg.name, en: 'hen eggs' } })]);
    await loadFoods(db, true);
    expect(inserted.length).toBe(FOODS.length - 1);
    expect(foodById('egg')?.name.en).toBe('hen eggs');
  });

  it('keeps the built-in foods when the table cannot be read', async () => {
    const { db } = fakeDb([], true);
    await loadFoods(db, true);
    expect(foodById('egg')?.name.en).toBe('eggs');
  });
});

describe('what staff save', () => {
  const body = {
    name: { en: 'quail eggs', de: 'Wachteleier', ro: 'ouă de prepeliță', hu: 'fürjtojás' },
    kind: 'egg',
    icon: 'egg',
    colour: '#E8D8C0',
    per100: { kcal: '158', protein: '13,1', carbs: 0.4, fat: 11.1, fibre: 0, salt: 0.35 },
    grams: { pcs: '9', tbsp: '' },
    density: '',
    allergens: ['eggs', 'nonsense'],
    origin: 'egg',
    spice: false,
    active: true,
  };
  const error = (fn: () => unknown) => {
    try {
      fn();
      return null;
    } catch (err) {
      return err instanceof HttpError ? err.key : String(err);
    }
  };

  it('reads a valid food (decimal commas too)', () => {
    expect(foodInput('quail-eggs', body)).toEqual({
      id: 'quail-eggs',
      name: body.name,
      kind: 'egg',
      icon: 'egg',
      colour: '#e8d8c0',
      per100: { kcal: 158, protein: 13.1, carbs: 0.4, fat: 11.1, fibre: 0, salt: 0.35 },
      grams: { pcs: 9 },
      allergens: ['eggs'],
      origin: 'egg',
    });
  });

  it('checks the id of a new food', () => {
    expect(foodIdInput(' Red-Onion ')).toBe('red-onion');
    for (const bad of ['a', 'red onion', 'red--onion', '-red', 'x'.repeat(41), 5]) {
      expect(
        error(() => foodIdInput(bad)),
        String(bad),
      ).toBe('foodId');
    }
  });

  it('refuses missing names, unknown kinds, bad numbers and origins', () => {
    expect(error(() => foodInput('x1', { ...body, name: { ...body.name, hu: ' ' } }))).toBe(
      'foodName',
    );
    expect(error(() => foodInput('x1', { ...body, kind: 'rock' }))).toBe('foodKind');
    expect(error(() => foodInput('x1', { ...body, icon: 'rocket' }))).toBe('foodKind');
    expect(error(() => foodInput('x1', { ...body, colour: 'red' }))).toBe('foodKind');
    expect(error(() => foodInput('x1', { ...body, per100: { ...body.per100, kcal: '' } }))).toBe(
      'foodNutrients',
    );
    expect(
      error(() => foodInput('x1', { ...body, per100: { ...body.per100, protein: 60, carbs: 60 } })),
    ).toBe('foodNutrients');
    expect(error(() => foodInput('x1', { ...body, grams: { pcs: '-1' } }))).toBe('foodWeights');
    expect(error(() => foodInput('x1', { ...body, density: '5' }))).toBe('foodWeights');
    expect(error(() => foodInput('x1', { ...body, origin: 'moon' }))).toBe('foodOrigin');
  });

  it('keeps a switched-off food switched off', () => {
    expect(foodInput('x1', { ...body, active: false }).active).toBe(false);
  });
});
