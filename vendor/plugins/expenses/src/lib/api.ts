import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginDatabase,
  PluginPeople,
  PluginUser,
} from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { todayIn } from './dates';
import { HttpError } from './http';

export interface ApiScope {
  request: Request;
  params: Record<string, string>;
  db: PluginDatabase;
  user: PluginUser;
  /** "Today" in the visitor's time zone (ADR 0010). */
  today: string;
  /** The visitor's DevQuake referrals (adding friends to a group). */
  people: PluginPeople | undefined;
  /** Free access for people a member invited (ADR 0043). */
  grantInvitedAccess: ((inviterUserId: number) => Promise<boolean>) | undefined;
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
        today: todayIn(ctx.timeZone || 'UTC'),
        people: ctx.people,
        grantInvitedAccess: ctx.grantInvitedAccess,
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
