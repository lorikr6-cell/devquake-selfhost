// The drawn ingredient thumbnails (components/food-icon.tsx): a small set of simple shapes, each
// drawn in a colour, so one shape serves many foods (a round fruit in red is an apple, in orange
// a peach). Made for DevQuake: no photos, no licences. Keys are stored with the foods: add
// freely, never rename or remove one.

export const FOOD_ICONS = {
  round: '#d94b3b',
  citrus: '#f2a33a',
  pear: '#b5c44a',
  cherry: '#c0263b',
  berry: '#5b4ab0',
  grapes: '#7b3f8c',
  strawberry: '#e0413d',
  banana: '#f3cf45',
  pineapple: '#e8b94a',
  melon: '#f08a6c',
  avocado: '#c5d86d',
  tomato: '#e2483a',
  pepper: '#d9412f',
  chili: '#d63a2b',
  carrot: '#ef8a2c',
  tuber: '#c9a46a',
  bulb: '#c9845a',
  leafy: '#7fbf4d',
  floret: '#4f9a3f',
  long: '#4c8b3a',
  corn: '#f2c94c',
  pod: '#6aa84f',
  mushroom: '#c8a27a',
  leaf: '#4f9a3f',
  sprig: '#5d8f45',
  seeds: '#b08a5a',
  jar: '#c0632e',
  stick: '#9a5a32',
  nut: '#a8743f',
  grain: '#e8dcc0',
  bread: '#d39a52',
  pasta: '#e9c46a',
  bottle: '#c9b03a',
  drop: '#5aa9e6',
  block: '#f3c94e',
  egg: '#f1e4cc',
  meat: '#c2454a',
  drumstick: '#d08a4a',
  fish: '#7aa6c2',
  shrimp: '#f08a5d',
  can: '#9aa5ad',
  cube: '#efe9dc',
  shaker: '#d9d9d9',
} as const;

export type FoodIcon = keyof typeof FOOD_ICONS;
export const FOOD_ICON_KEYS = Object.keys(FOOD_ICONS) as FoodIcon[];
export const isFoodIcon = (v: unknown): v is FoodIcon =>
  typeof v === 'string' && Object.hasOwn(FOOD_ICONS, v);

const HEX = /^#[0-9a-f]{6}$/;
export const isHexColour = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);
