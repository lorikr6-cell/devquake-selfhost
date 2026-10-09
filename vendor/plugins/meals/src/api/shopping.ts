import { translator } from '../i18n';
import { api } from '../lib/api';
import { getRecipe } from '../lib/cookbook';
import { mealsBetween, requireMember } from '../lib/data';
import { addDays } from '../lib/dates';
import { HttpError } from '../lib/http';
import { mergeItems, type ListItem } from '../lib/plan';

const UNIT_CODES = new Set([
  'g',
  'kg',
  'ml',
  'l',
  'pcs',
  'tsp',
  'tbsp',
  'cup',
  'clove',
  'pinch',
  'slice',
  'can',
]);
import { day, id, readBody } from '../lib/validate';

// POST /api/households/:id/shopping { week, listId }: the week's ingredients (every recipe part
// for its meal's servings, and the simple items as they are; leftovers left out) merged into one
// list and sent to a shopping list (link point list.add-items, 30 items per call).
export const POST = api(async ({ request, params, db, user, links, locale }) => {
  const householdId = id(params.id);
  await requireMember(db, householdId, user.id);
  const body = await readBody(request);
  const monday = day(body.week, 'week');
  const listId = id(body.listId);
  if (!links) throw new HttpError(503, 'linkFailed');
  const meals = (await mealsBetween(db, householdId, monday, addDays(monday, 6))).filter(
    (m) => !m.leftovers && m.items.length > 0,
  );
  if (meals.length === 0) throw new HttpError(400, 'noRecipes');
  const items: ListItem[] = [];
  let missing = 0;
  for (const m of meals) {
    for (const part of m.items) {
      if (!part.recipeRef) {
        items.push({ name: part.name, qty: part.qty, unit: part.unit ?? 'pcs' });
        continue;
      }
      const recipe = await getRecipe(links, part.recipeRef, m.servings);
      if (!recipe) {
        missing++;
        continue;
      }
      for (const i of recipe.ingredients) {
        if (i.unit === 'taste') continue;
        items.push({ name: i.name, qty: i.qty, unit: i.unit });
      }
    }
  }
  const merged = mergeItems(items);
  const tUnit = translator(locale, 'units');
  for (let i = 0; i < merged.length; i += 30) {
    const chunk = merged.slice(i, i + 30).map((x) => ({
      name: x.name,
      quantity: x.qty,
      unit: UNIT_CODES.has(x.unit) ? tUnit(x.unit) : x.unit,
    }));
    const result = await links.call('shopping', 'list.add-items', { listId, items: chunk });
    if (!result.ok) throw new HttpError(result.error === 'not-connected' ? 409 : 502, 'linkFailed');
  }
  return { added: merged.length, missing };
});
