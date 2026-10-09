import { describe, expect, it } from 'vitest';
import { LOCALES } from '@devquake/ui';
import { FOODS, foodById, searchFoods } from './foods';
import { LIBRARY, libraryIngredients } from './library';
import {
  TAGS,
  allergensOf,
  defaultScaling,
  formatQty,
  gramsOf,
  nutritionOf,
  roundQty,
  scaleQty,
  scaledIngredient,
  tagsOf,
  toImperial,
  type Ingredient,
} from './recipe';
import { parseQty } from './validate';

const ing = (foodId: string | null, qty: number | null, unit: Ingredient['unit']): Ingredient => ({
  name: foodId ?? 'x',
  qty,
  unit,
  foodId,
  scaling: defaultScaling(unit, foodById(foodId)),
  note: null,
});

describe('scaling', () => {
  it('follows the servings, keeps pieces whole and spices gentler', () => {
    expect(scaleQty(200, 'linear', 2, 5)).toBe(500);
    expect(scaleQty(3, 'whole', 2, 3)).toBe(5); // 4.5 eggs → 5
    expect(scaleQty(1, 'whole', 4, 1)).toBe(1); // never 0
    expect(scaleQty(1, 'spice', 2, 4)).toBeCloseTo(1.68, 2);
    expect(scaleQty(1, 'fixed', 2, 8)).toBe(1);
    expect(scaleQty(null, 'linear', 2, 4)).toBeNull();
  });

  it('picks a default from the unit and food', () => {
    expect(defaultScaling('pcs', foodById('egg'))).toBe('whole');
    expect(defaultScaling('tsp', foodById('salt'))).toBe('spice');
    expect(defaultScaling('g', foodById('rice'))).toBe('linear');
    expect(defaultScaling('taste', undefined)).toBe('fixed');
  });

  it('rounds for the kitchen', () => {
    expect(roundQty(333.3, 'g')).toBe(335);
    expect(roundQty(37.4, 'g')).toBe(37);
    expect(roundQty(1.3, 'tsp')).toBe(1.25);
    expect(roundQty(0.05, 'tsp')).toBe(0.25);
    expect(roundQty(2.2, 'pcs')).toBe(2);
    expect(scaledIngredient(ing('rice', 150, 'g'), 2, 3).qty).toBe(225);
  });

  it('shows imperial weights and volumes, and fractions', () => {
    expect(toImperial(250, 'g')).toEqual({ qty: 8.75, unit: 'oz' });
    expect(toImperial(1, 'kg')).toEqual({ qty: 2.25, unit: 'lb' });
    expect(toImperial(1.2, 'l')).toEqual({ qty: 1.25, unit: 'qt' });
    expect(toImperial(2, 'tbsp')).toEqual({ qty: 2, unit: 'tbsp' });
    expect(formatQty(1.5, 'en-GB')).toBe('1½');
    expect(formatQty(0.25, 'en-GB')).toBe('¼');
    expect(formatQty(250, 'de-DE')).toBe('250');
  });

  it('reads quantities the way people type them', () => {
    expect(parseQty('1,5')).toBe(1.5);
    expect(parseQty('1/2')).toBe(0.5);
    expect(parseQty('1 1/2')).toBe(1.5);
    expect(parseQty('½')).toBe(0.5);
    expect(parseQty('')).toBeNull();
    expect(Number.isNaN(parseQty('lots'))).toBe(true);
  });
});

describe('nutrition and tags', () => {
  it('weighs pieces, spoons and volumes', () => {
    expect(gramsOf(2, 'pcs', foodById('egg'))).toBe(100);
    expect(gramsOf(1, 'tbsp', foodById('olive-oil'))).toBe(13.5);
    expect(gramsOf(100, 'ml', foodById('olive-oil'))).toBeCloseTo(91);
    expect(gramsOf(1, 'cup', foodById('egg'))).toBeNull();
    expect(gramsOf(1, 'pcs', undefined)).toBeNull();
  });

  it('counts nutrition per portion and says what it could not count', () => {
    const n = nutritionOf(
      [ing('chicken-breast', 400, 'g'), ing(null, 1, 'pcs'), ing('salt', null, 'taste')],
      2,
    );
    expect(n.perPortion.protein).toBeCloseTo(45);
    expect(n.counted).toBe(1);
    expect(n.total).toBe(2);
  });

  it('works out tags from the numbers and drops declared ones the ingredients contradict', () => {
    const ingredients = [ing('chicken-breast', 300, 'g'), ing('broccoli', 200, 'g')];
    const tags = tagsOf({
      declared: ['vegetarian', 'gluten-free', 'quick'],
      ingredients,
      nutrition: nutritionOf(ingredients, 2),
      minutes: 45,
    }).map((x) => x.tag);
    expect(tags).toEqual(['gluten-free', 'high-protein', 'lower-carb']);
  });

  it('collects allergens from foods and the author', () => {
    expect(allergensOf([ing('soy-sauce', 1, 'tbsp'), ing('feta', 50, 'g')], ['sesame'])).toEqual([
      'gluten',
      'soy',
      'milk',
      'sesame',
    ]);
  });
});

describe('foods', () => {
  it('have unique ids, names in every language and sane values', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    for (const f of FOODS) {
      for (const l of LOCALES) expect(f.name[l], `${f.id} ${l}`).toBeTruthy();
      expect(f.per100.kcal, f.id).toBeLessThanOrEqual(900);
      expect(f.per100.protein + f.per100.carbs + f.per100.fat, f.id).toBeLessThanOrEqual(101);
    }
  });

  it('are found by name in any language, accents ignored', () => {
    expect(searchFoods('oua', 'ro').map((f) => f.id)).toContain('egg');
    expect(searchFoods('Kartoffel', 'de')[0]?.id).toBe('potato');
  });
});

describe('the library', () => {
  it('has unique ids, every text in every language, known foods and timers', () => {
    expect(new Set(LIBRARY.map((r) => r.id)).size).toBe(LIBRARY.length);
    for (const r of LIBRARY) {
      expect(r.id).toMatch(/^[a-z][a-z0-9-]+$/);
      for (const l of LOCALES) {
        expect(r.title[l], `${r.id} title ${l}`).toBeTruthy();
        expect(r.intro[l], `${r.id} intro ${l}`).toBeTruthy();
        expect(r.cuisine[l], `${r.id} cuisine ${l}`).toBeTruthy();
        if (r.tips) expect(r.tips[l], `${r.id} tips ${l}`).toBeTruthy();
        for (const s of r.steps) expect(s[l], `${r.id} step ${l}`).toBeTruthy();
      }
      for (const x of r.ingredients) expect(foodById(x.food), `${r.id} ${x.food}`).toBeDefined();
      for (const t of r.tags) expect(TAGS).toContain(t);
    }
  });

  it('counts the nutrition of every ingredient and keeps every declared tag', () => {
    for (const r of LIBRARY) {
      const ingredients = libraryIngredients(r, 'en');
      const nutrition = nutritionOf(ingredients, r.servings);
      expect(nutrition.counted, r.id).toBe(nutrition.total);
      const shown = tagsOf({
        declared: r.tags,
        ingredients,
        nutrition,
        minutes: r.prepMin + r.cookMin,
      }).map((x) => x.tag);
      for (const t of r.tags) expect(shown, `${r.id} ${t}`).toContain(t);
    }
  });
});
