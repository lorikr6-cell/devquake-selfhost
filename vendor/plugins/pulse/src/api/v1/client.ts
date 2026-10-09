import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { clientScript } from '../../lib/client-script';

// GET https://pulse.devquake.com/api/v1/client — the browser library (key route, ADR 0023).
// Public and cacheable; it holds no keys.
export const GET: PluginApiHandler = (_request, { ctx }) =>
  new Response(clientScript(ctx.baseUrl), {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });
