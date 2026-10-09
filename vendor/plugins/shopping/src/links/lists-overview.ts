import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { listsForUser } from '../lib/data';
import { todayIn } from '../lib/dates';

/**
 * Link point "lists.overview" (read, ADR 0035): the member's lists with open items, from a week
 * ago on, soonest shopping date first, at most `limit` (default 5, at most 20). Only lists the
 * member is on; no item names leave the app.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const raw = (input ?? {}) as { limit?: unknown };
  const limit = Math.min(20, Math.max(1, Number.isInteger(raw.limit) ? Number(raw.limit) : 5));
  const today = todayIn(ctx.timeZone);
  const weekAgo = new Date(Date.parse(`${today}T12:00:00Z`) - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const lists = (await listsForUser(ctx.db, ctx.user.id))
    .filter((l) => l.open > 0 && l.shopDate >= weekAgo)
    .sort((a, b) => a.shopDate.localeCompare(b.shopDate))
    .slice(0, limit)
    .map((l) => ({ id: l.id, name: l.name, shopDate: l.shopDate, open: l.open, done: l.done }));
  return { ok: true, data: { lists } };
};

export default handler;
