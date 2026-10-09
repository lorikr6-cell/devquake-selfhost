import { calendarRange, type PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { mealsOfUser } from '../lib/data';
import { slotIcon } from '../lib/plan';

/**
 * Link point "calendar.events" (read, ADR 0035): the planned meals of the member's households
 * from `from` to `to` (at most 62 days), as all-day events for the family calendar: the meal's
 * name with its slot's emoji. Nothing else leaves the app.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const range = calendarRange(input);
  if (!range) return { ok: false, error: 'invalid-input' };
  const meals = await mealsOfUser(ctx.db, ctx.user.id, range.from, range.to);
  const households = new Set(meals.map((m) => m.householdId));
  const events = meals.map((m) => ({
    id: `${m.id}`,
    title: `${slotIcon(m.slot)} ${m.title}${households.size > 1 ? ` · ${m.household}` : ''}`,
    day: m.day,
    startsAt: null,
    target: 'week',
    params: { id: String(m.householdId) },
  }));
  return { ok: true, data: { events } };
};

export default handler;
