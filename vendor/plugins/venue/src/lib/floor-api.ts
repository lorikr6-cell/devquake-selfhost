import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginContext,
  PluginDatabase,
} from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { tabletVenue, venueById, venueOfOwner, type Venue } from './data';
import { staffOnTablet } from './floor';
import { HttpError } from './http';
import { TABLET_COOKIE } from './secure';

/** Who works on the floor: the venue's owner (signed in) or the staff member on a tablet. */
export interface FloorActor {
  name: string;
  role: 'owner' | 'manager' | 'waiter' | 'kitchen' | 'bar';
  staffId: number | null;
  tabletId: number | null;
}

/** The header a paired phone (the Venue app) sends its token in (ADR 0083). */
export const DEVICE_HEADER = 'x-venue-device';

/** A cookie's value from a request. */
export function cookieOf(request: Request, name: string): string | undefined {
  const raw = request.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}

/**
 * The floor's actor from the context and the tablet cookie (pages pass the cookie from
 * next/headers, the API from the request). The owner always wins on their own device.
 */
export async function floorActor(
  ctx: PluginContext,
  tabletToken: string | undefined,
  deviceOnly = false,
): Promise<{ venue: Venue; actor: FloorActor | null; tabletId: number | null } | null> {
  if (!ctx.db) return null;
  if (ctx.user && !deviceOnly) {
    const venue = await venueOfOwner(ctx.db, ctx.user.id);
    if (venue)
      return {
        venue,
        tabletId: null,
        actor: { name: ctx.user.displayName, role: 'owner', staffId: null, tabletId: null },
      };
  }
  if (!tabletToken) return null;
  const tablet = await tabletVenue(ctx.db, tabletToken);
  if (!tablet) return null;
  const venue = await venueById(ctx.db, tablet.venueId);
  if (!venue) return null;
  const staff = await staffOnTablet(ctx.db, tablet.tabletId);
  return {
    venue,
    tabletId: tablet.tabletId,
    actor: staff
      ? { name: staff.name, role: staff.role, staffId: staff.id, tabletId: tablet.tabletId }
      : null,
  };
}

export interface FloorScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  ctx: PluginContext;
  venue: Venue;
  actor: FloorActor;
}

/**
 * The floor API (key routes, ADR 0080): the owner's browser or an enabled tablet with a staff
 * member on it. Writes must come from the app's own pages (Origin checked here, as key routes
 * skip the host's check). Turns HttpError into JSON errors ({ error, code }: the text and its key,
 * for the waiters' app) and return values into JSON.
 */
export function floorApi(
  fn: (scope: FloorScope) => Promise<unknown>,
  options: { tabletOnly?: boolean; allowNoStaff?: boolean } = {},
): PluginApiHandler {
  return async (request: Request, { params, ctx }: PluginApiArgs) => {
    const t = translator(localeOf(ctx));
    const fail = (status: number, key: string, values?: Record<string, string | number>) =>
      Response.json({ error: t(`errors.${key}`, values), code: key }, { status });
    if (!ctx.db) return fail(503, 'unavailable');
    // A paired phone sends its token in a header, which another site cannot add (no CORS), so
    // it needs no Origin; it is then only ever that device, never the browser's signed-in owner.
    const device = request.headers.get(DEVICE_HEADER)?.trim() || undefined;
    if (request.method !== 'GET' && !device) {
      const origin = request.headers.get('origin');
      if (!origin || origin !== ctx.baseUrl) return fail(403, 'crossSite');
    }
    try {
      const found = device
        ? await floorActor(ctx, device, true)
        : await floorActor(ctx, cookieOf(request, TABLET_COOKIE));
      if (!found) return fail(401, 'notTablet');
      if (options.tabletOnly && found.tabletId === null) return fail(403, 'notTablet');
      const actor =
        found.actor ??
        (options.allowNoStaff
          ? { name: '', role: 'waiter' as const, staffId: null, tabletId: found.tabletId }
          : null);
      if (!actor) return fail(401, 'pickStaff');
      const result = await fn({ request, params, db: ctx.db, ctx, venue: found.venue, actor });
      if (result instanceof Response) return result;
      if (result === undefined) return new Response(null, { status: 204 });
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      if (err instanceof HttpError) {
        const { field, ...rest } = err.params;
        const values = field === undefined ? rest : { ...rest, field: t(`fields.${field}`) };
        return Response.json(
          { error: t(`errors.${err.key}`, values), code: err.key },
          { status: err.status },
        );
      }
      throw err;
    }
  };
}
