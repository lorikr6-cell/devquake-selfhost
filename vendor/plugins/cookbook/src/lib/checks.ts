import type { RecipeView } from './data';
import { recipeChecks, type DraftForCheck } from './guide';

/** A saved recipe in the shape the checklist reads. */
export function draftOf(r: RecipeView): DraftForCheck {
  return {
    title: r.title,
    servings: r.servings,
    prepMin: r.prepMin,
    cookMin: r.cookMin,
    equipment: r.equipment ?? '',
    ingredients: r.ingredients,
    steps: r.steps,
  };
}

export const checksOf = (r: RecipeView) => recipeChecks(draftOf(r));
