// The food model: allergens, origins, kinds, weighed units, nutrients and the Food type. Small
// and free of data, so client components can import it (the food list is lib/foods.ts).

import type { Locale } from '@devquake/ui';
import type { FoodIcon } from './food-icons';

/** The 14 allergens food labels must show in the EU (Regulation 1169/2011, Annex II). */
export const ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const;
export type Allergen = (typeof ALLERGENS)[number];
export const isAllergen = (v: unknown): v is Allergen => ALLERGENS.includes(v as Allergen);

/** Where a food comes from: decides vegetarian, vegan and pescatarian. */
export const ORIGINS = ['plant', 'meat', 'fish', 'dairy', 'egg', 'honey'] as const;
export type Origin = (typeof ORIGINS)[number];

/** What kind of food it is: groups the catalogue and picks a sensible thumbnail. */
export const FOOD_KINDS = [
  'vegetable',
  'fruit',
  'herb',
  'spice',
  'legume',
  'grain',
  'nut',
  'dairy',
  'egg',
  'meat',
  'fish',
  'oil',
  'sweet',
  'condiment',
  'drink',
  'other',
] as const;
export type FoodKind = (typeof FOOD_KINDS)[number];

/** Units a food may have a weight for (a piece, a spoon…). */
export const WEIGHED_UNITS = [
  'pcs',
  'tsp',
  'tbsp',
  'cup',
  'clove',
  'pinch',
  'slice',
  'can',
] as const;
export type WeighedUnit = (typeof WEIGHED_UNITS)[number];

export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  salt: number;
}

export const NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat', 'fibre', 'salt'] as const;

export interface Food {
  id: string;
  name: Record<Locale, string>;
  kind: FoodKind;
  /** The drawn thumbnail (lib/food-icons.ts) and its colour (#rrggbb; the icon's own when absent). */
  icon: FoodIcon;
  colour?: string;
  /**
   * The picture staff chose to show everyone instead of the drawn thumbnail (food_photos id);
   * the thumbnail stays and comes back when it is unset.
   */
  photo?: number;
  /** false: kept for the recipes that use it, but no longer offered when typing an ingredient. */
  active?: boolean;
  /** Per 100 g. */
  per100: Nutrients;
  /** Grams of one piece, spoon, cup… (units not listed cannot be weighed). */
  grams?: Partial<Record<WeighedUnit, number>>;
  /** g per ml, for ml and l (1 when absent). */
  density?: number;
  allergens?: Allergen[];
  origin: Origin;
  /** Salt, spices and dried herbs scale less than linearly with the servings. */
  spice?: boolean;
}

/** What a browser needs to draw a food's thumbnail: a picture's URL, or the drawn icon. */
export interface FoodThumb {
  icon: FoodIcon;
  colour?: string;
  photo?: string;
  /** The picture is the viewer's own (only they see it). */
  mine?: boolean;
}

/** URL of a stored food picture (ids never change content, so it can be cached). */
export const foodPhotoUrl = (id: number, version?: number) =>
  `/api/food-photos/${id}${version ? `?v=${version}` : '?v=1'}`;
