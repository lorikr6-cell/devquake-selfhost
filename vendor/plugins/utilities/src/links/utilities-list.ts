import type { PluginLinkHandlerModule } from '@devquake/plugin-sdk';
import { utilitiesOfMember } from '../lib/data';

/**
 * Link point "utilities.list" (read, ADR 0035): the member's utilities (id, name, category,
 * currency), so another app can let them choose some, e.g. the ones that are a venue's running
 * costs. No bills, readings or other people leave the app.
 */
const handler: PluginLinkHandlerModule['default'] = async (_input, ctx) => {
  if (!ctx.db) return { ok: false, error: 'not-found' };
  return { ok: true, data: { utilities: await utilitiesOfMember(ctx.db, ctx.user.id) } };
};

export default handler;
