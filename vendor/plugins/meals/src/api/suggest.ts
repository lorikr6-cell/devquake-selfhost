import { api } from '../lib/api';
import { searchRecipes } from '../lib/cookbook';
import { addMeal, eatersOf, mealsBetween, requirePlanner } from '../lib/data';
import { addDays } from '../lib/dates';
import { HttpError } from '../lib/http';
import {
  LIMITS,
  dislikeWords,
  householdServings,
  isSlot,
  suggestWeek,
  weekDays,
  weekSeed,
  type PlannedSlot,
  type Slot,
} from '../lib/plan';
import { day, id, readBody } from '../lib/validate';
import { recipeItem } from '../lib/items';

// POST /api/households/:id/suggest { week (a Monday), slots: ['dinner', …] }: fills the empty
// slots of the week with cookbook recipes that fit the household's diet, allergens and dislikes.
export const POST = api(async ({ request, params, db, user, links }) => {
  const householdId = id(params.id);
  const { household } = await requirePlanner(db, householdId, user.id);
  const body = await readBody(request);
  const monday = day(body.week, 'week');
  const slots: Slot[] = Array.isArray(body.slots) ? body.slots.filter(isSlot) : ['dinner'];
  if (slots.length === 0) throw new HttpError(400, 'slot');
  const candidates = await searchRecipes(links, {
    tags: household.diet ? [household.diet] : [],
    without: household.avoid,
    limit: 100,
  });
  if (!candidates) throw new HttpError(502, 'cookbookFailed');
  const planned = await mealsBetween(db, householdId, monday, addDays(monday, 6));
  const empty: PlannedSlot[] = weekDays(monday).flatMap((d) =>
    slots
      .filter((s) => !planned.some((m) => m.day === d && m.slot === s))
      .map((s) => ({ day: d, slot: s })),
  );
  const picks = suggestWeek({
    candidates,
    empty,
    planned: planned.flatMap((m) => m.items.flatMap((i) => (i.recipeRef ? [i.recipeRef] : []))),
    avoid: household.avoid,
    dislikes: dislikeWords(household.dislikes),
    seed: weekSeed(householdId, monday),
  });
  if (picks.length === 0) throw new HttpError(400, 'noSuggestions');
  const servings = householdServings((await eatersOf(db, householdId)).map((e) => e.portion));
  let added = 0;
  for (const pick of picks) {
    const item = await recipeItem(links, pick.ref, servings).catch(() => null);
    if (!item) continue;
    await addMeal(db, householdId, user.id, {
      day: pick.day,
      slot: pick.slot,
      title: item.name.slice(0, LIMITS.mealTitle),
      servings,
      leftovers: false,
      note: null,
      remind: null,
      setId: null,
      items: [item],
    });
    added++;
  }
  return { added };
});
