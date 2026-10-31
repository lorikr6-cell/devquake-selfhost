import {
  activityRange,
  localDayOf,
  utcSearchWindow,
  type PluginLinkHandlerModule,
} from '@devquake/plugin-sdk';
import { purchasesOfList } from '../lib/data';

/**
 * Link point "list.purchases" (read, ADR 0035): what was bought on one of the member's lists from
 * `from` to `to` (their own days, at most 62), with each line's total and the sum, e.g. a venue's
 * purchasing list for its costs. Input { listId, from, to }. Reply { list: { id, name, currency },
 * items: [{ day, name, quantity, unit, total }], total }. Only lists the member is on.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const range = activityRange(input);
  const listId = Number((input as { listId?: unknown } | null)?.listId);
  if (!range || !Number.isInteger(listId) || listId <= 0)
    return { ok: false, error: 'invalid-input' };
  const { start, end } = utcSearchWindow(range);
  const found = await purchasesOfList(ctx.db, ctx.user.id, listId, start, end);
  if (!found) return { ok: false, error: 'not-found' };
  const items = found.items
    .map((i) => ({ ...i, day: localDayOf(i.doneAt, ctx.timeZone) }))
    .filter((i) => i.day >= range.from && i.day <= range.to)
    .map((i) => ({ day: i.day, name: i.name, quantity: i.quantity, unit: i.unit, total: i.total }));
  const total = Math.round(items.reduce((a, i) => a + i.total, 0) * 100) / 100;
  return { ok: true, data: { list: found.list, items, total } };
};

export default handler;
