import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginContext,
  PluginDatabase,
  PluginUser,
} from '@devquake/plugin-sdk';
import type { Locale, Translate } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { buyerBySession, buyerCookie, type Buyer } from './buyers-data';
import { storeBySlug, storeOfMember, type Store } from './data';
import { HttpError } from './http';
import { Buckets } from './rate';
import { can, type Area, type Role } from './roles';

function errorResponse(err: unknown, t: Translate): Response {
  if (err instanceof HttpError) {
    const { field, ...rest } = err.params;
    const values = field === undefined ? rest : { ...rest, field: t(`fields.${field}`) };
    return Response.json(
      { error: t(`errors.${err.key}`, values), code: err.key },
      { status: err.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  throw err; // the host logs it and answers 500
}

function toResponse(result: unknown): Response {
  if (result instanceof Response) return result;
  if (result === undefined) return new Response(null, { status: 204 });
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
}

export interface OwnerScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  /** The store the member owns or works on; null before they made or joined one. */
  store: Store | null;
  /** Their roles there (empty without a store). */
  roles: Role[];
  timeZone: string;
  ctx: PluginContext;
}

/**
 * The shop's API for its owner and team: a signed-in member and the database. With an `area`
 * the member needs a store and a role that may use that area (roles.ts); `null` is for calls
 * before there is a store (creating one, joining a team). Turns HttpError into JSON errors in
 * the visitor's language and return values into JSON (undefined → 204).
 */
export function api(
  area: Area | null,
  fn: (scope: OwnerScope) => Promise<unknown>,
): PluginApiHandler {
  return async (request: Request, { params, ctx }: PluginApiArgs) => {
    const t = translator(localeOf(ctx));
    if (!ctx.user) return Response.json({ error: t('errors.signIn') }, { status: 401 });
    if (!ctx.db) return Response.json({ error: t('errors.unavailable') }, { status: 503 });
    try {
      const membership = await storeOfMember(ctx.db, ctx.user.id);
      if (area !== null) {
        if (!membership) throw new HttpError(404, 'noStore');
        if (!can(membership.roles, area)) throw new HttpError(403, 'forbidden');
      }
      return toResponse(
        await fn({
          request,
          params,
          db: ctx.db,
          user: ctx.user,
          store: membership?.store ?? null,
          roles: membership?.roles ?? [],
          timeZone: ctx.timeZone || 'UTC',
          ctx,
        }),
      );
    } catch (err) {
      return errorResponse(err, t);
    }
  };
}

/** The member's store, or 404 when they have none yet. */
export function mine(store: Store | null): Store {
  if (!store) throw new HttpError(404, 'noStore');
  return store;
}

export interface ShopScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  /** The store named by :slug (published, unless the route allows otherwise). */
  store: Store;
  locale: Locale;
  t: Translate;
  ctx: PluginContext;
  /** The buyer signed in to this shop (their session cookie), if any. */
  buyer: () => Promise<Buyer | null>;
}

/** A cookie's value from a request. */
export function cookieOf(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

// One process's limits for buyers (ADR 0023 key routes limit their own callers).
const buckets = new Buckets();

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * The shop's routes for buyers, who never sign in: open GET routes and key routes (checkout,
 * paying, the providers' returns and webhooks). The store must exist and be published.
 * `limit` caps requests per IP address and minute; `sameSite` refuses calls that do not come
 * from the shop's own pages (the host checks nothing on key routes).
 */
export function shopApi(
  fn: (scope: ShopScope) => Promise<unknown>,
  options: {
    limit?: number;
    sameSite?: boolean;
    /** Payments in progress finish even when the owner has just closed the shop. */
    unpublished?: boolean;
  } = {},
): PluginApiHandler {
  return async (request: Request, { params, ctx }: PluginApiArgs) => {
    const locale = localeOf(ctx);
    const t = translator(locale);
    if (!ctx.db) return Response.json({ error: t('errors.unavailable') }, { status: 503 });
    try {
      if (options.sameSite) {
        const origin = request.headers.get('origin');
        if (!origin || origin !== new URL(ctx.baseUrl).origin)
          throw new HttpError(403, 'crossSite');
      }
      if (options.limit) {
        const perMinute = options.limit;
        const key = `${params.slug}:${clientIp(request)}:${new URL(request.url).pathname}`;
        if (!buckets.take(key, perMinute, perMinute, Date.now())) {
          throw new HttpError(429, 'tooMany');
        }
      }
      const store = await storeBySlug(ctx.db, params.slug ?? '');
      const db = ctx.db;
      if (!store || (!store.published && !options.unpublished))
        throw new HttpError(404, 'storeNotFound');
      // In maintenance, buyers can still finish payments already started, and nothing else.
      if (store.maintenance && !options.unpublished) throw new HttpError(503, 'maintenance');
      const buyer = () => buyerBySession(db, store.id, cookieOf(request, buyerCookie(store.id)));
      return toResponse(await fn({ request, params, db, store, locale, t, ctx, buyer }));
    } catch (err) {
      return errorResponse(err, t);
    }
  };
}
