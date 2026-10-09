import { calendarRange, type PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { listsForUser } from '../lib/data';

/**
 * Link point "calendar.events" (read, ADR 0035): the member's shopping lists by shopping date
 * from `from` to `to` (at most 62 days), as all-day items for a connected app's calendar. Only
 * list names leave the app, no items.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const range = calendarRange(input);
  if (!range) return { ok: false, error: 'invalid-input' };
  const events = (await listsForUser(ctx.db, ctx.user.id))
    .filter((l) => l.shopDate >= range.from && l.shopDate <= range.to)
    .map((l) => ({
      id: String(l.id),
      title: l.name,
      day: l.shopDate,
      startsAt: null,
      target: 'list',
      params: { id: String(l.id) },
    }));
  return { ok: true, data: { events } };
};

export default handler;
