import type { PluginApiHandler } from '@devquake/plugin-sdk';

// Available at https://utilities.devquake.com/api/health
export const GET: PluginApiHandler = (_request, { ctx }) =>
  Response.json({ ok: true, plugin: ctx.pluginId, time: new Date().toISOString() });
