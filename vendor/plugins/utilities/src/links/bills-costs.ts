import { calendarRange, type PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { billsOfMember } from '../lib/data';

/**
 * Link point "bills.costs" (read, ADR 0035): the bills of the member's utilities whose period is
 * from `from` to `to` (at most 62 days), with their totals, e.g. a venue's running costs in its
 * reports. Input { from, to, utilityIds? } (only those utilities when given). Reply { bills: [{
 * id, utilityId, utility, category, currency, period, dueOn, total }] }.
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const range = calendarRange(input);
  if (!range) return { ok: false, error: 'invalid-input' };
  const raw = (input as { utilityIds?: unknown }).utilityIds;
  const only = Array.isArray(raw) ? new Set(raw.map(Number).filter(Number.isInteger)) : null;
  const bills = (await billsOfMember(ctx.db, ctx.user.id, range.from, range.to)).filter(
    (b) => !only || only.has(b.utilityId),
  );
  return { ok: true, data: { bills } };
};

export default handler;
