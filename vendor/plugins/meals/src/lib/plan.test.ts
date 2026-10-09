import { describe, expect, it } from 'vitest';
import {
  dayTotals,
  dislikeWords,
  householdServings,
  mealNutrition,
  titleFromItems,
  mergeItems,
  reminderDue,
  suggestWeek,
  weekDays,
  weekStart,
  type Candidate,
} from './plan';

describe('weeks and servings', () => {
  it('start on Monday', () => {
    expect(weekStart('2026-10-08', '2026-10-03')).toBe('2026-10-05');
    expect(weekStart(undefined, '2026-10-03')).toBe('2026-09-28');
    expect(weekStart('nonsense', '2026-10-03')).toBe('2026-09-28');
    expect(weekDays('2026-09-28')).toHaveLength(7);
    expect(weekDays('2026-09-28')[6]).toBe('2026-10-04');
  });

  it('add up the eaters’ portions, rounded up', () => {
    expect(householdServings([1, 1, 0.5])).toBe(3);
    expect(householdServings([1, 1])).toBe(2);
    expect(householdServings([])).toBe(1);
  });
});

describe('suggestions', () => {
  const c = (
    ref: string,
    title: string,
    tags: string[] = [],
    allergens: string[] = [],
  ): Candidate => ({
    ref,
    title,
    tags,
    allergens,
  });
  const candidates = [
    c('oats', 'Overnight oats', ['breakfast'], ['milk']),
    c('soup', 'Lentil soup'),
    c('salmon', 'Salmon tray bake', [], ['fish']),
    c('mush', 'Mushroom risotto'),
    c('pasta', 'Spaghetti'),
  ];
  const slots = (days: string[], slot: 'breakfast' | 'dinner') =>
    days.map((day) => ({ day, slot }));

  it('fill empty slots without allergens, dislikes or repeats', () => {
    const picks = suggestWeek({
      candidates,
      empty: slots(['2026-10-05', '2026-10-06'], 'dinner'),
      planned: ['pasta'],
      avoid: ['fish'],
      dislikes: dislikeWords('mushroom'),
      seed: 1,
    });
    expect(picks.map((p) => p.ref)).toEqual(['soup', 'pasta']);
  });

  it('give breakfasts breakfast recipes and are the same for the same seed', () => {
    const args = {
      candidates,
      empty: slots(['2026-10-05'], 'breakfast'),
      planned: [],
      avoid: [],
      dislikes: [],
      seed: 7,
    };
    expect(suggestWeek(args).map((p) => p.ref)).toEqual(['oats']);
    const week = { ...args, empty: slots(weekDays('2026-10-05'), 'dinner') };
    expect(suggestWeek(week)).toEqual(suggestWeek(week));
    expect(suggestWeek({ ...args, avoid: ['milk'] })).toEqual([]);
  });
});

describe('the shopping list', () => {
  it('adds up the same ingredient and unit, rounds and converts', () => {
    expect(
      mergeItems([
        { name: 'Onions', qty: 2, unit: 'pcs' },
        { name: 'onions', qty: 1, unit: 'pcs' },
        { name: 'Rice', qty: 600, unit: 'g' },
        { name: 'rice', qty: 0.45, unit: 'kg' },
        { name: 'Salt', qty: null, unit: 'taste' },
        { name: 'salt', qty: null, unit: 'taste' },
        { name: 'Olive oil', qty: 2.1, unit: 'tbsp' },
        { name: 'Milk', qty: 120, unit: 'ml' },
      ]),
    ).toEqual([
      { name: 'Milk', qty: 120, unit: 'ml' },
      { name: 'Olive oil', qty: 2.25, unit: 'tbsp' },
      { name: 'Onions', qty: 3, unit: 'pcs' },
      { name: 'Rice', qty: 1.05, unit: 'kg' },
      { name: 'Salt', qty: null, unit: 'taste' },
    ]);
  });
});

describe('days and reminders', () => {
  it('add up a person’s day and say when nutrition is missing', () => {
    expect(
      dayTotals([
        { kcal: 400.4, protein: 20 },
        { kcal: 650, protein: 31.6 },
      ]),
    ).toEqual({
      kcal: 1050,
      protein: 52,
      known: true,
    });
    expect(
      dayTotals([
        { kcal: 400, protein: 20 },
        { kcal: null, protein: null },
      ]).known,
    ).toBe(false);
    expect(dayTotals([]).known).toBe(false);
  });

  it('send reminders from 18:00 the evening before until the day ends', () => {
    expect(reminderDue('2026-10-06', '2026-10-05T17:59')).toBe(false);
    expect(reminderDue('2026-10-06', '2026-10-05T18:00')).toBe(true);
    expect(reminderDue('2026-10-06', '2026-10-06T09:00')).toBe(true);
    expect(reminderDue('2026-10-06', '2026-10-07T09:00')).toBe(false);
    expect(reminderDue('2026-10-06', '2026-10-04T20:00')).toBe(false);
  });
});

describe('meals made of parts', () => {
  const recipe = (name: string, kcal: number | null, protein: number | null = 10) => ({
    recipeRef: name,
    name,
    kcal,
    protein,
  });
  const item = (name: string) => ({ recipeRef: null, name, kcal: null, protein: null });

  it('add up the recipe parts per person; items carry no nutrition', () => {
    expect(
      mealNutrition([recipe('soup', 300, 12), recipe('salad', 150, 3), item('bread')]),
    ).toEqual({ kcal: 450, protein: 15 });
    expect(mealNutrition([recipe('soup', null)])).toEqual({ kcal: null, protein: null });
    expect(mealNutrition([item('pizza')])).toEqual({ kcal: null, protein: null });
  });

  it('take the title from the first recipe, or the parts', () => {
    expect(titleFromItems([item('bread'), recipe('Goulash', 400)])).toBe('Goulash');
    expect(titleFromItems([item('bread'), item('cheese')])).toBe('bread, cheese');
  });
});
