import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginDatabase,
  PluginLinksApi,
  PluginPeople,
  PluginUser,
} from '@devquake/plugin-sdk';
import type { Locale } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { HttpError } from './http';

export interface ApiScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  people: PluginPeople | undefined;
  /** The visitor's time zone (ADR 0010), for "this month". */
  timeZone: string | undefined;
  /** The page language (texts sent to other apps). */
  locale: Locale;
  /** Links with other apps (ADR 0035), when the host offers them. */
  links: PluginLinksApi | undefined;
}

/**
 * Wraps an API handler: requires a signed-in user and the plugin database, turns HttpError into
 * JSON errors and plain return values into JSON responses (undefined → 204).
 */
export function api(fn: (scope: ApiScope) => Promise<unknown>): PluginApiHandler {
  return async (request: Request, { params, ctx }: PluginApiArgs) => {
    const t = translator(localeOf(ctx));
    if (!ctx.user) return Response.json({ error: t('errors.signIn') }, { status: 401 });
    if (!ctx.db) return Response.json({ error: t('errors.unavailable') }, { status: 503 });
    try {
      const result = await fn({
        request,
        params,
        db: ctx.db,
        user: ctx.user,
        people: ctx.people,
        timeZone: ctx.timeZone,
        locale: localeOf(ctx),
        links: ctx.links,
      });
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

/** The request body as bytes, refused above `max` bytes (413, errors.<tooLargeKey>). */
export async function readBytes(request: Request, max: number, tooLargeKey: string) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > max) throw new HttpError(413, tooLargeKey);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > max) throw new HttpError(413, tooLargeKey);
  if (bytes.byteLength === 0) throw new HttpError(400, 'emptyFile');
  return bytes;
}
