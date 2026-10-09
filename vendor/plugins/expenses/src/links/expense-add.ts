import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { addExpenseFromApp } from '../lib/data';
import { parseExpenseFromApp } from '../lib/link-input';

/**
 * Link point "expense.add" (write, ADR 0035): adds an expense to one of the member's groups,
 * paid by the member, e.g. a utility bill or a finished shopping list. Input in
 * lib/link-input.ts. Errors: not-found (no such group, or not in it), forbidden (someone in the
 * split is not in the group), invalid-input (anything else, a currency that is not the group's).
 * The same `source` twice returns the first expense ({ created: false }).
 */
const handler: PluginLinkHandlerModule['default'] = async (input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const parsed = parseExpenseFromApp(input, ctx.from);
  if (!parsed) return { ok: false, error: 'invalid-input' };
  const result = await addExpenseFromApp(ctx.db, ctx.user, parsed);
  if (!result.ok) return result;
  return {
    ok: true,
    data: { groupId: parsed.groupId, expenseId: result.expenseId, created: result.created },
  };
};

export default handler;
