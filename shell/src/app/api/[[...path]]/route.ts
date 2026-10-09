import { headers } from 'next/headers';
import { matchRoute, type HttpMethod } from '@devquake/plugin-sdk';
import { APP, loadPlugin } from '@/generated/app';
import { ready } from '@/lib/boot';
import { buildContext } from '@/lib/context';
import { database } from '@/lib/db';
import { isKeyRoute, isOpenRoute } from '@/lib/routes';
import { getSessionUser } from '@/lib/session';
import { sameOrigin } from '@/lib/url';
import { iconSvg } from '@/lib/icon';

// The app's API at /api/…, as on DevQuake: key routes for other servers (the app checks its own
// keys), shared links open for GET, everything else for signed-in members from this site.

type RouteContext = { params: Promise<{ path?: string[] }> };

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function dispatch(request: Request, context: RouteContext, method: HttpMethod) {
  const { path = [] } = await context.params;
  const route = `/${path.join('/')}`;

  // For Docker's health check and uptime monitors: is the app up and the database reachable?
  if (route === '/_health') {
    const state = await ready();
    const db = state.ok
      ? await database()
          .query('SELECT 1')
          .then(() => true)
          .catch(() => false)
      : false;
    return json(db ? 200 : 503, { app: APP.id, version: APP.version, ok: db });
  }

  const state = await ready();
  if (!state.ok) return json(503, { error: 'The instance is not ready (see the server log).' });
  const plugin = await loadPlugin();

  // What DevQuake's host answers for its apps: here there are no platform notifications.
  if (route === '/_notifications') {
    return method === 'GET'
      ? json(200, { items: [], unread: 0 })
      : new Response(null, { status: 204 });
  }
  if (route === '/_icon') {
    return new Response(iconSvg(), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  const match = matchRoute(Object.keys(plugin.api ?? {}), route);
  const run = async () => {
    if (!match) return json(404, { error: 'Not found' });
    const mod = await plugin.api![match.pattern]!();
    const handler = mod[method];
    if (!handler) return json(405, { error: 'Method not allowed' });
    return handler(request, { params: match.params, ctx: await buildContext(plugin.manifest) });
  };

  // Other websites and servers: no session or same-origin check; the app answers CORS itself.
  if (isKeyRoute(plugin.manifest, route)) return run();
  if (method === 'OPTIONS') return new Response(null, { status: 204 });

  const h = await headers();
  if (method !== 'GET' && method !== 'HEAD' && !sameOrigin(request, h)) {
    return json(403, { error: 'Cross-site request refused' });
  }
  const user = await getSessionUser().catch(() => null);
  const openToAll = method === 'GET' && isOpenRoute(plugin.manifest, 'api', route);
  if (!user && !openToAll) return json(401, { error: 'Sign in first' });
  return run();
}

const handle = (method: HttpMethod) => (request: Request, context: RouteContext) =>
  dispatch(request, context, method);

export const GET = handle('GET');
export const HEAD = handle('HEAD');
export const POST = handle('POST');
export const PUT = handle('PUT');
export const PATCH = handle('PATCH');
export const DELETE = handle('DELETE');
export const OPTIONS = handle('OPTIONS');

// Live streams (Server-Sent Events) and per-request data: never cached.
export const dynamic = 'force-dynamic';
