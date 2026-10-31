import {
  activityRange,
  type ActivityFeedItem,
  type PluginLinkHandlerModule,
} from '@devquake/plugin-sdk';
import { translator } from '../i18n';
import { mealsOfUser } from '../lib/data';
import { slotIcon } from '../lib/plan';

/**
 * Link point "activity.day" (read, ADR 0081): the meals of the member's households from `from`
 * to `to`, for a connected app such as the habits journal: the slot, the meal's name, whether it
 * was cooked, and the household when there are several. Nothing else leaves the app.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const range = activityRange(input);
  if (!range) return { ok: false, error: 'invalid-input' };
  const t = translator(ctx.locale);
  const meals = await mealsOfUser(ctx.db, ctx.user.id, range.from, range.to);
  const households = new Set(meals.map((m) => m.householdId));
  const items: ActivityFeedItem[] = meals.slice(0, 200).map((m) => ({
    id: `meal:${m.id}`,
    day: m.day,
    icon: slotIcon(m.slot),
    title: `${t(`slots.${m.slot}`)}: ${m.title}`,
    detail: [m.cooked ? '✓' : '', households.size > 1 ? m.household : '']
      .filter(Boolean)
      .join(' · '),
    target: 'week',
    params: { id: String(m.householdId) },
  }));
  return { ok: true, data: { items } };
};

export default handler;
