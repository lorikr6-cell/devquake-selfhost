import { describe, expect, it } from 'vitest';
import {
  dishFor,
  inBatches,
  ingredientsFor,
  linesToCook,
  scaleQty,
  scaledDish,
  type Dish,
} from './dishes';

const soup: Dish = {
  id: 1,
  title: 'Supă de pui',
  baseServings: 4,
  allergens: ['celery'],
  ingredients: [
    { name: 'Pui', qty: 500, unit: 'g', scaling: 'linear' },
    { name: 'Morcovi', qty: 2, unit: 'pcs', scaling: 'whole' },
    { name: 'Piper', qty: 1, unit: 'tsp', scaling: 'spice' },
    { name: 'Sare', qty: null, unit: 'taste', scaling: 'fixed' },
  ],
};
const puree: Dish = {
  id: 2,
  title: 'Piure',
  baseServings: 2,
  allergens: ['milk'],
  ingredients: [{ name: 'pui', qty: 100, unit: 'g', scaling: 'linear' }],
};

describe('dishes for a canteen', () => {
  it('scales like Cookbook: linear, whole pieces, spices gently, "to taste" unchanged', () => {
    expect(scaleQty(500, 'linear', 4, 120)).toBe(15_000);
    expect(scaleQty(2, 'whole', 4, 6)).toBe(3);
    expect(scaleQty(1, 'spice', 4, 64)).toBeCloseTo(8);
    expect(scaleQty(null, 'fixed', 4, 64)).toBeNull();
    expect(scaledDish(soup, 41).map((i) => i.qty)).toEqual([5125, 21, expect.any(Number), null]);
  });

  it('finds the dish a menu line names, in any case', () => {
    expect(dishFor('  supă DE pui ', [soup, puree])?.id).toBe(1);
    expect(dishFor('Compot', [soup, puree])).toBeUndefined();
  });

  it('cooks the variant for its diet and the menu for everyone else', () => {
    const lines = linesToCook({
      dishes: 'Supă de pui\nCompot',
      variants: { pureed: 'Piure' },
      portions: { normal: 10, diabetic: 3, pureed: 2 },
    });
    expect(lines).toEqual([
      { line: 'Piure', portions: 2 },
      { line: 'Supă de pui', portions: 13 },
      { line: 'Compot', portions: 13 },
    ]);
  });

  it('merges the week by name and unit and splits it for Shopping', () => {
    const items = ingredientsFor(
      [
        {
          dishes: 'Supă de pui',
          variants: { pureed: 'Piure' },
          portions: { normal: 4, pureed: 2 },
        },
        { dishes: 'Supă de pui', variants: {}, portions: { normal: 4 } },
      ],
      [soup, puree],
    );
    const chicken = items.find((i) => i.name.toLowerCase() === 'pui');
    expect(chicken).toMatchObject({ quantity: 1100, unit: 'g' });
    expect(items.find((i) => i.name === 'Sare')?.quantity).toBeNull();
    expect(inBatches(Array.from({ length: 65 }, (_, i) => i)).map((b) => b.length)).toEqual([
      30, 30, 5,
    ]);
  });
});
