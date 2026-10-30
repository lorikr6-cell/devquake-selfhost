import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginContext,
  PluginDatabase,
  PluginUser,
} from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { venueOfOwner, type Venue } from './data';
import { HttpError } from './http';

export interface OwnerScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  /** The member's own venue; null only for `needVenue: false` (creating it). */
  venue: Venue | null;
  /** The whole context (links with other apps, the time zone). */
  ctx: PluginContext;
}

/**
 * The venue's owner API (admin settings, the menu): a signed-in member, the database and their own
 * venue (ADR 0080: never a tablet PIN). Turns HttpError into JSON errors in the visitor's language
 * and return values into JSON (undefined → 204).
 */
export function ownerApi(
  fn: (scope: OwnerScope & { venue: Venue }) => Promise<unknown>,
): PluginApiHandler;
export function ownerApi(
  fn: (scope: OwnerScope) => Promise<unknown>,
  options: { needVenue: false },
): PluginApiHandler;
export function ownerApi(
  // The overloads say which scope `fn` gets; a venue is checked below unless needVenue is false.
  fn: (scope: OwnerScope & { venue: Venue }) => Promise<unknown>,
  options: { needVenue?: boolean } = {},
): PluginApiHandler {
  return async (request: Request, { params, ctx }: PluginApiArgs) => {
    const t = translator(localeOf(ctx));
    if (!ctx.user) return Response.json({ error: t('errors.signIn') }, { status: 401 });
    if (!ctx.db) return Response.json({ error: t('errors.unavailable') }, { status: 503 });
    try {
      const venue = await venueOfOwner(ctx.db, ctx.user.id);
      if (options.needVenue !== false && !venue) throw new HttpError(404, 'noVenue');
      const result = await fn({ request, params, db: ctx.db, user: ctx.user, venue: venue!, ctx });
      if (result instanceof Response) return result;
      if (result === undefined) return new Response(null, { status: 204 });
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      if (err instanceof HttpError) {
        const { field, ...rest } = err.params;
        const values = field === undefined ? rest : { ...rest, field: t(`fields.${field}`) };
        return Response.json({ error: t(`errors.${err.key}`, values) }, { status: err.status });
      }
      throw err; // the host logs it and answers 500
    }
  };
}

/** A failed check as an HttpError (the field only when there is one). */
export function badInput(c: { error: string; field?: string; max?: number }): HttpError {
  return new HttpError(
    400,
    c.error,
    c.field ? { field: c.field, max: c.max ?? 0 } : { max: c.max ?? 0 },
  );
}

export const jsonBody = async (request: Request) =>
  (await request.json().catch(() => ({}))) as Record<string, unknown>;
