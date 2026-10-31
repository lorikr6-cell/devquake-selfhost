import {
  activityRange,
  localDayOf,
  utcSearchWindow,
  type ActivityFeedItem,
  type PluginLinkHandlerModule,
} from '@devquake/plugin-sdk';
import { boughtBy } from '../lib/data';

/**
 * Link point "activity.day" (read, ADR 0081): what the member ticked off on their shopping lists
 * from `from` to `to` (their own days), one item per list and day with the first few names, for
 * a connected app such as the habits journal. Prices and other people stay in the app.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const range = activityRange(input);
  if (!range) return { ok: false, error: 'invalid-input' };
  const { start, end } = utcSearchWindow(range);
  const groups = new Map<string, { day: string; listId: number; list: string; names: string[] }>();
  for (const b of await boughtBy(ctx.db, ctx.user.id, start, end)) {
    const day = localDayOf(b.doneAt, ctx.timeZone);
    if (day < range.from || day > range.to) continue;
    const key = `${b.listId}:${day}`;
    const g = groups.get(key) ?? { day, listId: b.listId, list: b.list, names: [] };
    g.names.push(b.name);
    groups.set(key, g);
  }
  const items: ActivityFeedItem[] = [...groups.entries()].map(([key, g]) => ({
    id: `bought:${key}`,
    day: g.day,
    icon: '🛒',
    title: `${g.list} (${g.names.length})`,
    detail: g.names.slice(0, 4).join(', ') + (g.names.length > 4 ? ' …' : ''),
    target: 'list',
    params: { id: String(g.listId) },
  }));
  return { ok: true, data: { items } };
};

export default handler;
