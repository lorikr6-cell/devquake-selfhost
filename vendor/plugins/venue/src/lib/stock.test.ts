import { describe, expect, it } from 'vitest';
import { parseQty, shortItems, toBuy, type Ingredient } from './stock';

const ing = (
  id: number,
  name: string,
  stock: number,
  daily: number,
  weekly: number,
): Ingredient => ({
  id,
  name,
  unit: 'pcs',
  stock,
  dailyTarget: daily,
  weeklyTarget: weekly,
  countedAt: null,
});

describe('stock', () => {
  it('reads quantities as people type them', () => {
    expect(parseQty('1,5')).toBe(1.5);
    expect(parseQty('250')).toBe(250);
    expect(parseQty('0.125')).toBe(0.125);
    expect(parseQty('1.2345')).toBeNull();
    expect(parseQty('-3')).toBeNull();
  });

  it('says what to buy to reach the daily or the weekly level', () => {
    const list = [
      ing(1, 'Milk', 2.5, 6, 30),
      ing(2, 'Buns', 40, 30, 150),
      ing(3, 'Beer', 10, 10, 48),
    ];
    expect(toBuy(list, 'daily').map((x) => [x.ingredient.name, x.qty])).toEqual([['Milk', 4]]);
    expect(toBuy(list, 'weekly').map((x) => [x.ingredient.name, x.qty])).toEqual([
      ['Milk', 28],
      ['Buns', 110],
      ['Beer', 38],
    ]);
  });

  it('finds the menu items that cannot be made, and why', () => {
    const stock = new Map([
      [1, { name: 'Beans', stock: 10 }],
      [2, { name: 'Milk', stock: 0.1 }],
    ]);
    const recipes = [
      { itemId: 10, ingredientId: 1, qty: 18 }, // espresso: 18 g of beans, only 10 left
      { itemId: 11, ingredientId: 2, qty: 0.15 }, // flat white: milk short
      { itemId: 11, ingredientId: 1, qty: 9 },
      { itemId: 12, ingredientId: 1, qty: 9 }, // tea biscuit… fine
    ];
    const short = shortItems(recipes, stock);
    expect([...short.entries()]).toEqual([
      [10, ['Beans']],
      [11, ['Milk']],
    ]);
  });
});
