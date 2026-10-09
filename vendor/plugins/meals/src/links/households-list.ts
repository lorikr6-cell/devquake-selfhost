import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { householdsOf } from '../lib/data';

/**
 * Link point "households.list" (read, ADR 0035): the member's households (id and name), for
 * "Plan this recipe" in the cookbook.
 */
const handler: PluginLinkHandlerModule['default'] = async (_input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  const households = (await householdsOf(ctx.db, ctx.user.id)).map((h) => ({
    id: h.id,
    name: h.name,
  }));
  return { ok: true, data: { households } };
};

export default handler;
