import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { translator } from '../i18n';
import { HttpError } from '../lib/http';
import { addItem } from '../lib/mutations';
import { quantity } from '../lib/validate';

const MAX_ITEMS = 30;

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/**
 * Link point "list.add-items" (write, ADR 0035): adds items to one of the member's lists, e.g.
 * from the family planner. Input { listId, items: [{ name, quantity?, unit? }] } (at most 30).
 * Each item is added as the member, exactly as if they typed it (events, live updates).
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const raw = (input ?? {}) as { listId?: unknown; items?: unknown };
  const listId = Number(raw.listId);
  if (!Number.isSafeInteger(listId) || listId <= 0 || !Array.isArray(raw.items)) {
    return { ok: false, error: 'invalid-input' };
  }
  const items = raw.items.slice(0, MAX_ITEMS);
  if (items.length === 0) return { ok: false, error: 'invalid-input' };
  const defaultUnit = translator(ctx.locale)('list.defaultUnit');
  let added = 0;
  try {
    for (const item of items) {
      const it = (item ?? {}) as { name?: unknown; quantity?: unknown; unit?: unknown };
      const name = text(it.name, 120);
      if (!name) continue;
      await addItem(ctx.db, listId, ctx.user, {
        name,
        quantity: quantity(it.quantity ?? null),
        unit: text(it.unit, 16) || defaultUnit,
        price: null,
        description: null,
        storeId: null,
      });
      added++;
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        ok: false,
        error: err.status === 404 || err.status === 403 ? 'not-found' : 'invalid-input',
      };
    }
    throw err;
  }
  return { ok: true, data: { listId, added } };
};

export default handler;
