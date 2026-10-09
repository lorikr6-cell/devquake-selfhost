import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { groupsOverview } from '../lib/data';

/**
 * Link point "groups.overview" (read, ADR 0035): the member's expense groups with their currency
 * and who is in them (platform user ids), so another app can offer only groups that fit, e.g.
 * Utilities for a bill everyone on it shares.
 */
const handler: PluginLinkHandlerModule['default'] = async (_input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  return { ok: true, data: { groups: await groupsOverview(ctx.db, ctx.user.id) } };
};

export default handler;
