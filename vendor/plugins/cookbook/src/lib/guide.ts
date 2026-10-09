// Making recipes easy to follow and easy to write: which ingredients each step uses, timers the
// text mentions, the "get ready" list, and the checklist the editor shows (the same checks
// decide whether a recipe may be made public). Pure: shared by the editor, the views and tests.

import type { Ingredient, Stage, Step } from './recipe';

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** The words of an ingredient's name that identify it ("chopped tomatoes (canned)" → chopped, tomatoes). */
function nameStems(name: string): string[] {
  return fold(name.replace(/\([^)]*\)/g, ' '))
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3)
    .map((w) => w.slice(0, Math.max(3, w.length - 2)));
}

/**
 * The ingredients a step's text mentions (positions), matched on word stems so "onions" finds
 * "onion" and "tojás" finds "tojást". A helper: authors confirm or change it.
 */
export function mentions(text: string, ingredients: Pick<Ingredient, 'name'>[]): number[] {
  const words = fold(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const out: number[] = [];
  ingredients.forEach((ing, i) => {
    const stems = nameStems(ing.name);
    if (stems.length && stems.some((stem) => words.some((w) => w.startsWith(stem)))) out.push(i);
  });
  return out;
}

/** The ingredients a step uses: what the author chose, or else what its text mentions. */
export function stepUses(step: Step, ingredients: Pick<Ingredient, 'name'>[]): number[] {
  const chosen = step.uses?.filter((i) => i >= 0 && i < ingredients.length);
  return chosen ?? mentions(step.text, ingredients);
}

/** Minutes a step's text mentions ("simmer 20 minutes", "1 óra", "10–12 min"), for a timer. */
export function suggestedTimerMin(text: string): number | null {
  const t = fold(text);
  const hours = /(\d+(?:[.,]\d+)?)\s*(?:h\b|hours?|stunden?|ore|ora\b|orak?\b)/.exec(t);
  const minutes =
    /(\d+)(?:\s*[-–]\s*\d+)?\s*(?:min\b|mins?\b|minutes?|minuten?|minute|minut|perc)/.exec(t);
  const total =
    (hours ? Number(hours[1]!.replace(',', '.')) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return total > 0 && total <= 24 * 60 ? Math.round(total) : null;
}

/** "Get ready" tasks: every ingredient with a preparation note ("finely chopped"). */
export function prepTasks<T extends Pick<Ingredient, 'note'>>(
  ingredients: T[],
): { ingredient: T; index: number }[] {
  return ingredients.flatMap((ingredient, index) =>
    ingredient.note ? [{ ingredient, index }] : [],
  );
}

/** Steps grouped by stage, in the order prepare → cook → serve, keeping their numbers. */
export function stepsByStage(
  steps: Step[],
): { stage: Stage; steps: { step: Step; n: number }[] }[] {
  return (['prepare', 'cook', 'serve'] as const)
    .map((stage) => ({
      stage,
      steps: steps.flatMap((step, i) => (step.stage === stage ? [{ step, n: i + 1 }] : [])),
    }))
    .filter((g) => g.steps.length > 0);
}

// --- The editor's checklist

export interface DraftForCheck {
  title: string;
  servings: number;
  prepMin: number;
  cookMin: number;
  equipment: string;
  ingredients: {
    name: string;
    qty: number | null;
    unit: string;
    foodId: string | null;
    note: string | null;
  }[];
  steps: { text: string; timerSec: number | null; stage: Stage; uses: number[] | null }[];
}

export interface Check {
  key: string;
  ok: boolean;
  /** required: needed to make the recipe public; tip: makes it easier to follow. */
  level: 'required' | 'tip';
  values?: Record<string, string | number>;
}

/** A step this long probably holds several actions. */
export const LONG_STEP = 400;

/**
 * Everything that makes a recipe complete enough for others to cook it: the required basics
 * (title, servings, ingredients with quantities, steps) and tips (times, every ingredient used
 * in a step, one action per step, timers for timed steps, how to cut, equipment, nutrition).
 */
export function recipeChecks(d: DraftForCheck): Check[] {
  const ingredients = d.ingredients.filter((i) => i.name.trim());
  const steps = d.steps.filter((s) => s.text.trim());
  const used = new Set(steps.flatMap((s) => stepUses({ ...s, text: s.text }, ingredients)));
  const unused = ingredients.filter((_, i) => !used.has(i)).map((i) => i.name);
  const untimed = steps.filter((s) => !s.timerSec && suggestedTimerMin(s.text)).length;
  const long = steps.filter((s) => s.text.length > LONG_STEP).length;
  const needsPrep = ingredients.filter(
    (i) => !i.note && (i.unit === 'pcs' || i.unit === 'clove') && i.foodId !== 'egg',
  ).length;
  const quantities = ingredients.filter((i) => i.qty !== null || i.unit === 'taste').length;
  const linked = ingredients.filter((i) => i.foodId).length;
  return [
    { key: 'title', ok: d.title.trim().length >= 3, level: 'required' },
    { key: 'servings', ok: d.servings >= 1, level: 'required' },
    {
      key: 'ingredients',
      ok: ingredients.length >= 1 && quantities === ingredients.length,
      level: 'required',
      values: { missing: ingredients.length - quantities },
    },
    { key: 'steps', ok: steps.length >= 1, level: 'required' },
    { key: 'times', ok: d.prepMin + d.cookMin > 0, level: 'tip' },
    {
      key: 'unused',
      ok: unused.length === 0,
      level: 'tip',
      values: { names: unused.slice(0, 5).join(', ') },
    },
    { key: 'oneAction', ok: long === 0, level: 'tip', values: { count: long } },
    { key: 'timers', ok: untimed === 0, level: 'tip', values: { count: untimed } },
    { key: 'prep', ok: needsPrep === 0, level: 'tip', values: { count: needsPrep } },
    { key: 'equipment', ok: d.equipment.trim().length > 0, level: 'tip' },
    {
      key: 'nutrition',
      ok: ingredients.length > 0 && linked === ingredients.length,
      level: 'tip',
      values: { linked, total: ingredients.length },
    },
    { key: 'serve', ok: steps.some((s) => s.stage === 'serve'), level: 'tip' },
  ];
}

/** Whether the required checks pass (the recipe may be made public). */
export const publishable = (checks: Check[]) => checks.every((c) => c.level !== 'required' || c.ok);

/** Equipment suggestions offered as one-tap chips in the editor (codes; labels in the catalog). */
export const EQUIPMENT = [
  'pan',
  'pot',
  'oven',
  'tray',
  'bowl',
  'board',
  'whisk',
  'blender',
  'sieve',
  'grater',
] as const;
