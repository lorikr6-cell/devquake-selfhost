// Foods (ingredients) with their nutrition per 100 g (approximate values, rounded, after USDA
// FoodData Central, public domain), the weight of a piece or spoon, the EU allergens they
// contain, where they come from (for the diet checks), a kind and a drawn thumbnail. Names in
// every language (ADR 0011). Ids are stored in recipes: add freely, never rename or remove one.
//
// The catalogue lives in the app's database (table `foods`, migration 0003), where staff edit it
// (/admin/foods). The list in code (FOODS, with lib/foods-extra.ts) seeds that table and is the
// fallback while the database cannot be read. lib/food-store.ts loads the database catalogue
// into this module (setFoodCatalogue) at the start of each request, so the pure recipe maths
// (lib/recipe.ts) can stay synchronous.

import type { Locale } from '@devquake/ui';
import { EXTRA_FOODS } from './foods-extra';
import type { FoodIcon } from './food-icons';
import { FOOD_KINDS, foodPhotoUrl, type Food, type FoodThumb, type Nutrients } from './food-model';

// The model (allergens, kinds, units, the Food type) is in lib/food-model.ts, which client
// components import without pulling in the food list.
export * from './food-model';

export const n = (
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  fibre: number,
  salt: number,
): Nutrients => ({
  kcal,
  protein,
  carbs,
  fat,
  fibre,
  salt,
});

/** The built-in foods (more in lib/foods-extra.ts). */
const CORE_FOODS: Food[] = [
  {
    id: 'egg',
    kind: 'egg',
    icon: 'egg',
    name: { en: 'eggs', de: 'Eier', ro: 'ouă', hu: 'tojás' },
    per100: n(143, 12.6, 0.7, 9.5, 0, 0.36),
    grams: { pcs: 50 },
    allergens: ['eggs'],
    origin: 'egg',
  },
  {
    id: 'tomato',
    kind: 'vegetable',
    icon: 'tomato',
    name: { en: 'tomatoes', de: 'Tomaten', ro: 'roșii', hu: 'paradicsom' },
    per100: n(18, 0.9, 3.9, 0.2, 1.2, 0.01),
    grams: { pcs: 120 },
    origin: 'plant',
  },
  {
    id: 'canned-tomatoes',
    kind: 'vegetable',
    icon: 'can',
    colour: '#d9412f',
    name: {
      en: 'chopped tomatoes (canned)',
      de: 'gehackte Tomaten (Dose)',
      ro: 'roșii tocate (conservă)',
      hu: 'darabolt paradicsom (konzerv)',
    },
    per100: n(21, 1, 3.9, 0.3, 1, 0.3),
    grams: { can: 400 },
    origin: 'plant',
  },
  {
    id: 'tomato-paste',
    kind: 'condiment',
    icon: 'jar',
    colour: '#c8372d',
    name: { en: 'tomato paste', de: 'Tomatenmark', ro: 'pastă de roșii', hu: 'paradicsompüré' },
    per100: n(82, 4.3, 19, 0.5, 4.1, 0.15),
    grams: { tbsp: 16, tsp: 5 },
    origin: 'plant',
  },
  {
    id: 'onion',
    kind: 'vegetable',
    icon: 'bulb',
    name: { en: 'onions', de: 'Zwiebeln', ro: 'ceapă', hu: 'vöröshagyma' },
    per100: n(40, 1.1, 9.3, 0.1, 1.7, 0.01),
    grams: { pcs: 110 },
    origin: 'plant',
  },
  {
    id: 'garlic',
    kind: 'vegetable',
    icon: 'bulb',
    colour: '#ece4d6',
    name: { en: 'garlic', de: 'Knoblauch', ro: 'usturoi', hu: 'fokhagyma' },
    per100: n(149, 6.4, 33, 0.5, 2.1, 0.04),
    grams: { clove: 4, pcs: 40 },
    origin: 'plant',
  },
  {
    id: 'bell-pepper',
    kind: 'vegetable',
    icon: 'pepper',
    name: {
      en: 'bell peppers',
      de: 'Paprikaschoten',
      ro: 'ardei grași',
      hu: 'kaliforniai paprika',
    },
    per100: n(31, 1, 6, 0.3, 2.1, 0.01),
    grams: { pcs: 150 },
    origin: 'plant',
  },
  {
    id: 'carrot',
    kind: 'vegetable',
    icon: 'carrot',
    name: { en: 'carrots', de: 'Karotten', ro: 'morcovi', hu: 'sárgarépa' },
    per100: n(41, 0.9, 9.6, 0.2, 2.8, 0.17),
    grams: { pcs: 60 },
    origin: 'plant',
  },
  {
    id: 'potato',
    kind: 'vegetable',
    icon: 'tuber',
    name: { en: 'potatoes', de: 'Kartoffeln', ro: 'cartofi', hu: 'burgonya' },
    per100: n(77, 2, 17, 0.1, 2.2, 0.02),
    grams: { pcs: 170 },
    origin: 'plant',
  },
  {
    id: 'zucchini',
    kind: 'vegetable',
    icon: 'long',
    name: { en: 'zucchini', de: 'Zucchini', ro: 'dovlecei', hu: 'cukkini' },
    per100: n(17, 1.2, 3.1, 0.3, 1, 0.02),
    grams: { pcs: 200 },
    origin: 'plant',
  },
  {
    id: 'cucumber',
    kind: 'vegetable',
    icon: 'long',
    colour: '#5f9e3f',
    name: { en: 'cucumbers', de: 'Gurken', ro: 'castraveți', hu: 'uborka' },
    per100: n(15, 0.7, 3.6, 0.1, 0.5, 0.01),
    grams: { pcs: 300 },
    origin: 'plant',
  },
  {
    id: 'broccoli',
    kind: 'vegetable',
    icon: 'floret',
    name: { en: 'broccoli', de: 'Brokkoli', ro: 'broccoli', hu: 'brokkoli' },
    per100: n(34, 2.8, 6.6, 0.4, 2.6, 0.08),
    grams: { pcs: 300 },
    origin: 'plant',
  },
  {
    id: 'spinach',
    kind: 'vegetable',
    icon: 'leafy',
    colour: '#3f8a3a',
    name: { en: 'spinach', de: 'Spinat', ro: 'spanac', hu: 'spenót' },
    per100: n(23, 2.9, 3.6, 0.4, 2.2, 0.2),
    grams: { cup: 30 },
    origin: 'plant',
  },
  {
    id: 'lettuce',
    kind: 'vegetable',
    icon: 'leafy',
    colour: '#8cc65a',
    name: { en: 'lettuce', de: 'Blattsalat', ro: 'salată verde', hu: 'fejes saláta' },
    per100: n(15, 1.4, 2.9, 0.2, 1.3, 0.07),
    grams: { pcs: 300 },
    origin: 'plant',
  },
  {
    id: 'mushrooms',
    kind: 'vegetable',
    icon: 'mushroom',
    name: { en: 'mushrooms', de: 'Champignons', ro: 'ciuperci', hu: 'gomba' },
    per100: n(22, 3.1, 3.3, 0.3, 1, 0.01),
    grams: { pcs: 20 },
    origin: 'plant',
  },
  {
    id: 'olives',
    kind: 'vegetable',
    icon: 'berry',
    colour: '#55602e',
    name: { en: 'olives', de: 'Oliven', ro: 'măsline', hu: 'olajbogyó' },
    per100: n(115, 0.8, 6, 11, 3.2, 1.8),
    grams: { pcs: 4 },
    origin: 'plant',
  },
  {
    id: 'lemon-juice',
    kind: 'fruit',
    icon: 'citrus',
    colour: '#f2d33a',
    name: { en: 'lemon juice', de: 'Zitronensaft', ro: 'suc de lămâie', hu: 'citromlé' },
    per100: n(22, 0.4, 6.9, 0.2, 0.3, 0),
    grams: { tbsp: 15, tsp: 5, pcs: 40 },
    origin: 'plant',
  },
  {
    id: 'banana',
    kind: 'fruit',
    icon: 'banana',
    name: { en: 'bananas', de: 'Bananen', ro: 'banane', hu: 'banán' },
    per100: n(89, 1.1, 23, 0.3, 2.6, 0),
    grams: { pcs: 120 },
    origin: 'plant',
  },
  {
    id: 'apple',
    kind: 'fruit',
    icon: 'round',
    name: { en: 'apples', de: 'Äpfel', ro: 'mere', hu: 'alma' },
    per100: n(52, 0.3, 14, 0.2, 2.4, 0),
    grams: { pcs: 180 },
    origin: 'plant',
  },
  {
    id: 'berries',
    kind: 'fruit',
    icon: 'berry',
    name: {
      en: 'mixed berries',
      de: 'gemischte Beeren',
      ro: 'fructe de pădure',
      hu: 'vegyes bogyós gyümölcs',
    },
    per100: n(50, 0.7, 12, 0.3, 2.4, 0),
    grams: { cup: 145 },
    origin: 'plant',
  },
  {
    id: 'parsley',
    kind: 'herb',
    icon: 'leaf',
    name: { en: 'parsley', de: 'Petersilie', ro: 'pătrunjel', hu: 'petrezselyem' },
    per100: n(36, 3, 6.3, 0.8, 3.3, 0.14),
    grams: { tbsp: 4 },
    origin: 'plant',
  },
  {
    id: 'basil',
    kind: 'herb',
    icon: 'leaf',
    colour: '#3f9a4a',
    name: { en: 'basil', de: 'Basilikum', ro: 'busuioc', hu: 'bazsalikom' },
    per100: n(23, 3.2, 2.7, 0.6, 1.6, 0.01),
    grams: { tbsp: 2 },
    origin: 'plant',
  },
  {
    id: 'dill',
    kind: 'herb',
    icon: 'sprig',
    name: { en: 'dill', de: 'Dill', ro: 'mărar', hu: 'kapor' },
    per100: n(43, 3.5, 7, 1.1, 2.1, 0.15),
    grams: { tbsp: 1 },
    origin: 'plant',
  },
  {
    id: 'ginger',
    kind: 'spice',
    icon: 'tuber',
    colour: '#d8b07a',
    name: { en: 'ginger', de: 'Ingwer', ro: 'ghimbir', hu: 'gyömbér' },
    per100: n(80, 1.8, 18, 0.8, 2, 0.03),
    grams: { tsp: 2, tbsp: 6 },
    origin: 'plant',
  },
  {
    id: 'red-lentils',
    kind: 'legume',
    icon: 'seeds',
    colour: '#d9733a',
    name: { en: 'red lentils', de: 'rote Linsen', ro: 'linte roșie', hu: 'vörös lencse' },
    per100: n(358, 24, 63, 2.2, 11, 0.02),
    grams: { cup: 190 },
    origin: 'plant',
  },
  {
    id: 'chickpeas',
    kind: 'legume',
    icon: 'seeds',
    colour: '#d8b56a',
    name: {
      en: 'chickpeas (canned, drained)',
      de: 'Kichererbsen (Dose, abgetropft)',
      ro: 'năut (conservă, scurs)',
      hu: 'csicseriborsó (konzerv, lecsöpögtetve)',
    },
    per100: n(139, 7, 22, 2.6, 7, 0.6),
    grams: { can: 240, cup: 165 },
    origin: 'plant',
  },
  {
    id: 'rice',
    kind: 'grain',
    icon: 'grain',
    colour: '#f4efe4',
    name: { en: 'rice', de: 'Reis', ro: 'orez', hu: 'rizs' },
    per100: n(365, 7.1, 80, 0.7, 1.3, 0.01),
    grams: { cup: 185 },
    origin: 'plant',
  },
  {
    id: 'spaghetti',
    kind: 'grain',
    icon: 'pasta',
    name: { en: 'spaghetti', de: 'Spaghetti', ro: 'spaghete', hu: 'spagetti' },
    per100: n(371, 13, 75, 1.5, 3.2, 0.01),
    allergens: ['gluten'],
    origin: 'plant',
  },
  {
    id: 'flour',
    kind: 'grain',
    icon: 'grain',
    colour: '#f7f3ea',
    name: { en: 'wheat flour', de: 'Weizenmehl', ro: 'făină de grâu', hu: 'búzaliszt' },
    per100: n(364, 10, 76, 1, 2.7, 0),
    grams: { cup: 125, tbsp: 8 },
    allergens: ['gluten'],
    origin: 'plant',
  },
  {
    id: 'oats',
    kind: 'grain',
    icon: 'grain',
    colour: '#d9c39a',
    name: { en: 'rolled oats', de: 'Haferflocken', ro: 'fulgi de ovăz', hu: 'zabpehely' },
    per100: n(379, 13, 68, 6.5, 10, 0.02),
    grams: { cup: 80, tbsp: 6 },
    allergens: ['gluten'],
    origin: 'plant',
  },
  {
    id: 'bread',
    kind: 'grain',
    icon: 'bread',
    name: { en: 'bread', de: 'Brot', ro: 'pâine', hu: 'kenyér' },
    per100: n(265, 9, 49, 3.2, 2.7, 1.2),
    grams: { slice: 30 },
    allergens: ['gluten'],
    origin: 'plant',
  },
  {
    id: 'cornmeal',
    kind: 'grain',
    icon: 'grain',
    colour: '#f2c94c',
    name: { en: 'cornmeal (polenta)', de: 'Maisgrieß (Polenta)', ro: 'mălai', hu: 'kukoricadara' },
    per100: n(362, 8.1, 77, 3.6, 7.3, 0.09),
    grams: { cup: 160 },
    origin: 'plant',
  },
  {
    id: 'sugar',
    kind: 'sweet',
    icon: 'cube',
    name: { en: 'sugar', de: 'Zucker', ro: 'zahăr', hu: 'cukor' },
    per100: n(387, 0, 100, 0, 0, 0),
    grams: { tbsp: 12.5, tsp: 4.2 },
    origin: 'plant',
  },
  {
    id: 'honey',
    kind: 'sweet',
    icon: 'jar',
    colour: '#e8a72e',
    name: { en: 'honey', de: 'Honig', ro: 'miere', hu: 'méz' },
    per100: n(304, 0.3, 82, 0, 0.2, 0.01),
    grams: { tbsp: 21, tsp: 7 },
    origin: 'honey',
  },
  {
    id: 'olive-oil',
    kind: 'oil',
    icon: 'bottle',
    colour: '#a9b53a',
    name: { en: 'olive oil', de: 'Olivenöl', ro: 'ulei de măsline', hu: 'olívaolaj' },
    per100: n(884, 0, 0, 100, 0, 0),
    grams: { tbsp: 13.5, tsp: 4.5 },
    density: 0.91,
    origin: 'plant',
  },
  {
    id: 'sunflower-oil',
    kind: 'oil',
    icon: 'bottle',
    colour: '#f2c94c',
    name: {
      en: 'sunflower oil',
      de: 'Sonnenblumenöl',
      ro: 'ulei de floarea-soarelui',
      hu: 'napraforgóolaj',
    },
    per100: n(884, 0, 0, 100, 0, 0),
    grams: { tbsp: 13.5, tsp: 4.5 },
    density: 0.92,
    origin: 'plant',
  },
  {
    id: 'butter',
    kind: 'dairy',
    icon: 'block',
    colour: '#f6dd7a',
    name: { en: 'butter', de: 'Butter', ro: 'unt', hu: 'vaj' },
    per100: n(717, 0.9, 0.1, 81, 0, 0.03),
    grams: { tbsp: 14, tsp: 5 },
    allergens: ['milk'],
    origin: 'dairy',
  },
  {
    id: 'milk',
    kind: 'dairy',
    icon: 'drop',
    colour: '#eef3f7',
    name: { en: 'milk', de: 'Milch', ro: 'lapte', hu: 'tej' },
    per100: n(61, 3.2, 4.8, 3.3, 0, 0.11),
    grams: { cup: 245, tbsp: 15 },
    density: 1.03,
    allergens: ['milk'],
    origin: 'dairy',
  },
  {
    id: 'greek-yogurt',
    kind: 'dairy',
    icon: 'jar',
    colour: '#ece7da',
    name: {
      en: 'Greek yogurt',
      de: 'griechischer Joghurt',
      ro: 'iaurt grecesc',
      hu: 'görög joghurt',
    },
    per100: n(97, 9, 3.9, 5, 0, 0.09),
    grams: { tbsp: 15, cup: 245 },
    allergens: ['milk'],
    origin: 'dairy',
  },
  {
    id: 'sour-cream',
    kind: 'dairy',
    icon: 'jar',
    colour: '#efe9dc',
    name: { en: 'sour cream', de: 'saure Sahne', ro: 'smântână', hu: 'tejföl' },
    per100: n(193, 2.1, 4.6, 19, 0, 0.08),
    grams: { tbsp: 15 },
    allergens: ['milk'],
    origin: 'dairy',
  },
  {
    id: 'feta',
    kind: 'dairy',
    icon: 'block',
    colour: '#f1ede2',
    name: {
      en: 'feta (white cheese)',
      de: 'Feta (Schafskäse)',
      ro: 'telemea',
      hu: 'feta (fehér sajt)',
    },
    per100: n(264, 14, 4, 21, 0, 2.8),
    allergens: ['milk'],
    origin: 'dairy',
  },
  {
    id: 'parmesan',
    kind: 'dairy',
    icon: 'block',
    colour: '#f1d27a',
    name: { en: 'Parmesan', de: 'Parmesan', ro: 'parmezan', hu: 'parmezán' },
    per100: n(431, 38, 4, 29, 0, 4),
    grams: { tbsp: 5 },
    allergens: ['milk'],
    origin: 'dairy',
  },
  {
    id: 'cheese',
    kind: 'dairy',
    icon: 'block',
    name: { en: 'hard cheese', de: 'Hartkäse', ro: 'cașcaval', hu: 'trappista sajt' },
    per100: n(356, 25, 1.3, 28, 0, 1.6),
    grams: { slice: 20 },
    allergens: ['milk'],
    origin: 'dairy',
  },
  {
    id: 'chicken-breast',
    kind: 'meat',
    icon: 'drumstick',
    name: { en: 'chicken breast', de: 'Hähnchenbrust', ro: 'piept de pui', hu: 'csirkemell' },
    per100: n(120, 22.5, 0, 2.6, 0, 0.15),
    origin: 'meat',
  },
  {
    id: 'minced-beef',
    kind: 'meat',
    icon: 'meat',
    colour: '#b8434a',
    name: {
      en: 'minced beef',
      de: 'Rinderhackfleisch',
      ro: 'carne tocată de vită',
      hu: 'darált marhahús',
    },
    per100: n(250, 17, 0, 20, 0, 0.2),
    origin: 'meat',
  },
  {
    id: 'beef',
    kind: 'meat',
    icon: 'meat',
    name: {
      en: 'beef (for stewing)',
      de: 'Rindfleisch (zum Schmoren)',
      ro: 'carne de vită (pentru tocană)',
      hu: 'marhahús (pörköltnek)',
    },
    per100: n(158, 20, 0, 8.5, 0, 0.16),
    origin: 'meat',
  },
  {
    id: 'bacon',
    kind: 'meat',
    icon: 'meat',
    colour: '#d0646a',
    name: { en: 'bacon', de: 'Speck', ro: 'bacon', hu: 'szalonna' },
    per100: n(417, 13, 1.4, 40, 0, 2.6),
    grams: { slice: 12 },
    origin: 'meat',
  },
  {
    id: 'salmon',
    kind: 'fish',
    icon: 'fish',
    colour: '#f08a6c',
    name: { en: 'salmon', de: 'Lachs', ro: 'somon', hu: 'lazac' },
    per100: n(208, 20, 0, 13, 0, 0.15),
    allergens: ['fish'],
    origin: 'fish',
  },
  {
    id: 'tuna',
    kind: 'fish',
    icon: 'can',
    colour: '#7aa6c2',
    name: {
      en: 'tuna (canned, drained)',
      de: 'Thunfisch (Dose, abgetropft)',
      ro: 'ton (conservă, scurs)',
      hu: 'tonhal (konzerv, lecsöpögtetve)',
    },
    per100: n(116, 26, 0, 0.8, 0, 0.9),
    grams: { can: 140 },
    allergens: ['fish'],
    origin: 'fish',
  },
  {
    id: 'tofu',
    kind: 'legume',
    icon: 'block',
    colour: '#efe8d6',
    name: { en: 'tofu', de: 'Tofu', ro: 'tofu', hu: 'tofu' },
    per100: n(144, 15.8, 2.8, 8.7, 2.3, 0.03),
    allergens: ['soy'],
    origin: 'plant',
  },
  {
    id: 'soy-sauce',
    kind: 'condiment',
    icon: 'bottle',
    colour: '#4a2c1a',
    name: { en: 'soy sauce', de: 'Sojasauce', ro: 'sos de soia', hu: 'szójaszósz' },
    per100: n(53, 8, 4.9, 0.6, 0.8, 14.3),
    grams: { tbsp: 16, tsp: 5 },
    allergens: ['gluten', 'soy'],
    origin: 'plant',
  },
  {
    id: 'vegetable-stock',
    kind: 'condiment',
    icon: 'drop',
    colour: '#c9a23a',
    name: { en: 'vegetable stock', de: 'Gemüsebrühe', ro: 'supă de legume', hu: 'zöldségalaplé' },
    per100: n(5, 0.2, 0.9, 0.1, 0, 0.6),
    grams: { cup: 240 },
    allergens: ['celery'],
    origin: 'plant',
  },
  {
    id: 'water',
    kind: 'drink',
    icon: 'drop',
    name: { en: 'water', de: 'Wasser', ro: 'apă', hu: 'víz' },
    per100: n(0, 0, 0, 0, 0, 0),
    grams: { cup: 240 },
    origin: 'plant',
  },
  {
    id: 'peanuts',
    kind: 'nut',
    icon: 'nut',
    colour: '#c8955a',
    name: { en: 'peanuts', de: 'Erdnüsse', ro: 'arahide', hu: 'földimogyoró' },
    per100: n(567, 26, 16, 49, 8.5, 0.02),
    grams: { tbsp: 9 },
    allergens: ['peanuts'],
    origin: 'plant',
  },
  {
    id: 'walnuts',
    kind: 'nut',
    icon: 'nut',
    name: { en: 'walnuts', de: 'Walnüsse', ro: 'nuci', hu: 'dió' },
    per100: n(654, 15, 14, 65, 6.7, 0),
    grams: { tbsp: 7 },
    allergens: ['nuts'],
    origin: 'plant',
  },
  {
    id: 'mustard',
    kind: 'condiment',
    icon: 'jar',
    colour: '#d9b02e',
    name: { en: 'mustard', de: 'Senf', ro: 'muștar', hu: 'mustár' },
    per100: n(66, 4.4, 5.8, 3.3, 3.3, 2.8),
    grams: { tsp: 5, tbsp: 15 },
    allergens: ['mustard'],
    origin: 'plant',
  },
  {
    id: 'salt',
    kind: 'spice',
    icon: 'shaker',
    name: { en: 'salt', de: 'Salz', ro: 'sare', hu: 'só' },
    per100: n(0, 0, 0, 0, 0, 100),
    grams: { tsp: 6, pinch: 0.4 },
    origin: 'plant',
    spice: true,
  },
  {
    id: 'black-pepper',
    kind: 'spice',
    icon: 'shaker',
    colour: '#4a4a4a',
    name: { en: 'black pepper', de: 'schwarzer Pfeffer', ro: 'piper negru', hu: 'fekete bors' },
    per100: n(251, 10, 64, 3.3, 25, 0.05),
    grams: { tsp: 2.3, pinch: 0.1 },
    origin: 'plant',
    spice: true,
  },
  {
    id: 'paprika',
    kind: 'spice',
    icon: 'jar',
    colour: '#c8372d',
    name: {
      en: 'sweet paprika',
      de: 'Paprikapulver (edelsüß)',
      ro: 'boia dulce',
      hu: 'fűszerpaprika',
    },
    per100: n(282, 14, 54, 13, 35, 0.17),
    grams: { tsp: 2.3, tbsp: 7 },
    origin: 'plant',
    spice: true,
  },
  {
    id: 'cumin',
    kind: 'spice',
    icon: 'jar',
    colour: '#a8743f',
    name: {
      en: 'ground cumin',
      de: 'Kreuzkümmel (gemahlen)',
      ro: 'chimion măcinat',
      hu: 'őrölt római kömény',
    },
    per100: n(375, 17.8, 44, 22, 10.5, 0.4),
    grams: { tsp: 2.1 },
    origin: 'plant',
    spice: true,
  },
  {
    id: 'caraway',
    kind: 'spice',
    icon: 'seeds',
    colour: '#7a5a3a',
    name: { en: 'caraway seeds', de: 'Kümmel', ro: 'chimen', hu: 'köménymag' },
    per100: n(333, 20, 50, 15, 38, 0.04),
    grams: { tsp: 2.1 },
    origin: 'plant',
    spice: true,
  },
  {
    id: 'oregano',
    kind: 'herb',
    icon: 'leaf',
    colour: '#6b8a3a',
    name: {
      en: 'dried oregano',
      de: 'getrockneter Oregano',
      ro: 'oregano uscat',
      hu: 'szárított oregánó',
    },
    per100: n(265, 9, 69, 4.3, 42.5, 0.06),
    grams: { tsp: 1 },
    origin: 'plant',
    spice: true,
  },
  {
    id: 'cinnamon',
    kind: 'spice',
    icon: 'stick',
    name: { en: 'ground cinnamon', de: 'Zimt', ro: 'scorțișoară', hu: 'őrölt fahéj' },
    per100: n(247, 4, 81, 1.2, 53, 0.03),
    grams: { tsp: 2.6, pinch: 0.3 },
    origin: 'plant',
    spice: true,
  },
  {
    id: 'chili-flakes',
    kind: 'spice',
    icon: 'chili',
    name: { en: 'chili flakes', de: 'Chiliflocken', ro: 'fulgi de chili', hu: 'chilipehely' },
    per100: n(282, 12, 50, 14, 35, 0.2),
    grams: { tsp: 1.8, pinch: 0.2 },
    origin: 'plant',
    spice: true,
  },
  {
    id: 'bay-leaf',
    kind: 'herb',
    icon: 'leaf',
    colour: '#7a9a4a',
    name: { en: 'bay leaves', de: 'Lorbeerblätter', ro: 'foi de dafin', hu: 'babérlevél' },
    per100: n(313, 7.6, 75, 8.4, 26, 0.06),
    grams: { pcs: 0.2 },
    origin: 'plant',
    spice: true,
  },
];

/** The built-in foods: the seed of the database catalogue and its fallback. */
export const FOODS: Food[] = [...CORE_FOODS, ...EXTRA_FOODS];

/** Finds a food by id (the recipe maths take one, so the browser can pass the recipe's foods). */
export type FoodLookup = (id: string | null | undefined) => Food | undefined;

let catalogue = new Map(FOODS.map((f) => [f.id, f]));

/**
 * Replaces the catalogue the lookups use (lib/food-store.ts, from the database). Built-in foods
 * missing from `foods` stay available, so recipes never lose an ingredient.
 */
export function setFoodCatalogue(foods: Food[]): void {
  const next = new Map(FOODS.map((f) => [f.id, f]));
  for (const f of foods) next.set(f.id, f);
  catalogue = next;
}

/** Every food of the catalogue (inactive ones too), by kind and English name. */
export function allFoods(): Food[] {
  return [...catalogue.values()].sort(
    (a, b) =>
      FOOD_KINDS.indexOf(a.kind) - FOOD_KINDS.indexOf(b.kind) || a.name.en.localeCompare(b.name.en),
  );
}

export const foodById: FoodLookup = (id) => (id ? catalogue.get(id) : undefined);

/** A lookup over just these foods (for client components, which get the recipe's foods). */
export function lookupOf(foods: Food[]): FoodLookup {
  const byId = new Map(foods.map((f) => [f.id, f]));
  return (id) => (id ? byId.get(id) : undefined);
}

/**
 * The thumbnails of these ingredients' foods, by food id (for client components): the viewer's
 * own picture of a food (`mine`, food id → URL), else the one staff chose, else the drawing.
 */
export function thumbsOf(
  ingredients: Array<{ foodId: string | null }>,
  mine: Record<string, string> = {},
): Record<string, FoodThumb> {
  const out: Record<string, FoodThumb> = {};
  for (const i of ingredients) {
    const food = foodById(i.foodId);
    if (food) out[food.id] = thumbOf(food, mine);
  }
  return out;
}

/** One food's thumbnail for this viewer (see thumbsOf). */
export function thumbOf(food: Food, mine: Record<string, string> = {}): FoodThumb {
  const thumb: FoodThumb = { icon: food.icon };
  if (food.colour) thumb.colour = food.colour;
  const own = mine[food.id];
  if (own) return { ...thumb, photo: own, mine: true };
  if (food.photo) thumb.photo = foodPhotoUrl(food.photo);
  return thumb;
}

/** Active foods whose name in `locale` contains the text (accents and case ignored), best first. */
export function searchFoods(text: string, locale: Locale, limit = 8): Food[] {
  const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = fold(text.trim());
  if (!q) return [];
  return [...catalogue.values()]
    .filter((f) => f.active !== false)
    .map((f) => ({ f, at: fold(f.name[locale]).indexOf(q) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at || a.f.name[locale].localeCompare(b.f.name[locale]))
    .slice(0, limit)
    .map((x) => x.f);
}
