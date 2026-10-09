import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginDatabase,
  PluginSession,
  PluginUser,
} from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { EngineError } from './engine/engine';
import { HttpError } from './http';

export interface ApiScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  session: PluginSession | null | undefined;
  url: URL;
}

/**
 * Wraps an API handler: requires a signed-in user and the plugin database, turns HttpError and
 * the rules' EngineError into JSON errors in the visitor's language, and plain return values
 * into JSON responses (undefined → 204).
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
        session: ctx.session,
        url: new URL(request.url),
      });
      if (result instanceof Response) return result;
      if (result === undefined) return new Response(null, { status: 204 });
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      if (err instanceof EngineError) {
        return Response.json({ error: t(`errors.${err.code}`) }, { status: 409 });
      }
      if (err instanceof HttpError) {
        const { field, ...rest } = err.params;
        const values = field === undefined ? rest : { ...rest, field: t(`fields.${field}`) };
        return Response.json({ error: t(`errors.${err.key}`, values) }, { status: err.status });
      }
      throw err; // the host logs it and answers 500
    }
  };
}

/** Keeps the sign-in alive while someone is playing (ADR 0014): at most every few minutes. */
export async function keepSignedIn(session: PluginSession | null | undefined) {
  if (!session) return;
  const left = Date.parse(session.expiresAt) - Date.now();
  if (left < 60 * 60 * 1000) await session.extend(2).catch(() => undefined);
}
