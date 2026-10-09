import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginDatabase,
  PluginLinksApi,
  PluginUser,
} from '@devquake/plugin-sdk';
import type { Locale } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { todayIn } from './dates';
import { loadFoods } from './food-store';
import { HttpError } from './http';

export interface ApiScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  /** The visitor's time zone (ADR 0010). */
  timeZone: string;
  /** "Today" in the visitor's time zone. */
  today: string;
  /** Links with other apps (ADR 0035), when the host offers them. */
  links: PluginLinksApi | undefined;
  /** The page language (ADR 0011). */
  locale: Locale;
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
    const timeZone = ctx.timeZone || 'UTC';
    try {
      await loadFoods(ctx.db);
      const result = await fn({
        request,
        params,
        db: ctx.db,
        user: ctx.user,
        timeZone,
        today: todayIn(timeZone),
        links: ctx.links,
        locale: localeOf(ctx),
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
