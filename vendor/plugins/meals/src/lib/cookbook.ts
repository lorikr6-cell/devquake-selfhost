import type { PluginLinkedApp, PluginLinksApi } from '@devquake/plugin-sdk';
import type { Candidate } from './plan';

/**
 * The cookbook app through its link points (ADR 0035): the meal planner never stores recipes,
 * it asks the cookbook for them while the member has the two apps connected.
 */

export interface RecipeHit extends Candidate {
  servings: number;
  minutes: number;
  kcal: number | null;
  protein: number | null;
}

export interface RecipeDetail {
  ref: string;
  title: string;
  servings: number;
  ingredients: { name: string; qty: number | null; unit: string }[];
  perPortion: { kcal: number; protein: number; carbs: number; fat: number };
  /** 'library' and 'public' recipes can be read by other members (needed for public meals). */
  visibility?: 'library' | 'public' | 'shared' | 'private';
}

/** How the cookbook stands for this member: connected, or how to get there; null without links. */
export async function cookbookLink(
  links: PluginLinksApi | undefined,
): Promise<PluginLinkedApp | null> {
  if (!links) return null;
  return (await links.list().catch(() => [])).find((a) => a.app === 'cookbook') ?? null;
}

export async function searchRecipes(
  links: PluginLinksApi | undefined,
  input: { query?: string; tags?: string[]; without?: string[]; limit?: number },
): Promise<RecipeHit[] | null> {
  if (!links) return null;
  const res = await links.call<{ recipes?: RecipeHit[] }>('cookbook', 'recipes.search', input);
  if (!res.ok || !Array.isArray(res.data?.recipes)) return null;
  return res.data.recipes.filter((r) => typeof r?.ref === 'string' && typeof r.title === 'string');
}

export async function getRecipe(
  links: PluginLinksApi | undefined,
  ref: string,
  servings: number,
): Promise<RecipeDetail | null> {
  if (!links) return null;
  const res = await links.call<RecipeDetail>('cookbook', 'recipe.get', { ref, servings });
  if (!res.ok || typeof res.data?.title !== 'string' || !Array.isArray(res.data.ingredients))
    return null;
  return res.data;
}
