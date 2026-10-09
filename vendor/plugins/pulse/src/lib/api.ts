import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginDatabase,
  PluginUser,
} from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { accountPlan } from './data';
import { HttpError } from './http';
import { masterKey } from './keys';
import { LIMITS, planOf, type Limits, type Plan } from './limits';

export interface ApiScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  master: Buffer;
  plan: Plan;
  limits: Limits;
  baseUrl: string;
}

/**
 * Wraps a dashboard API handler (the member's own pages): requires a signed-in user, the
 * database and the master key; turns HttpError into JSON errors in the visitor's language and
 * plain return values into JSON (undefined → 204).
 */
export function api(fn: (scope: ApiScope) => Promise<unknown>): PluginApiHandler {
  return async (request: Request, { params, ctx }: PluginApiArgs) => {
    const t = translator(localeOf(ctx));
    if (!ctx.user) return Response.json({ error: t('errors.signIn') }, { status: 401 });
    const master = masterKey();
    if (!ctx.db || !master) {
      return Response.json({ error: t('errors.unavailable') }, { status: 503 });
    }
    try {
      const level = ctx.accessOf
        ? ((await ctx.accessOf([ctx.user.id]))[ctx.user.id] ?? 'none')
        : 'member';
      const plan = planOf(level, await accountPlan(ctx.db, ctx.user.id)) ?? 'trial';
      const result = await fn({
        request,
        params,
        db: ctx.db,
        user: ctx.user,
        master,
        plan,
        limits: LIMITS[plan],
        baseUrl: ctx.baseUrl,
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

/** The JSON body as an object (400 when it is not one). */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'invalidRequest');
  }
  return body as Record<string, unknown>;
}
