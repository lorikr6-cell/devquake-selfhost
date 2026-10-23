import type { Locale } from '@devquake/ui';
import type {
  PluginApiArgs,
  PluginApiHandler,
  PluginDatabase,
  PluginInvitations,
  PluginLinksApi,
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
  /** Free access for people a member invited (ADR 0043). */
  grantInvitedAccess: ((inviterUserId: number) => Promise<boolean>) | undefined;
  /** The page language, for files the app writes (the export). */
  locale: Locale;
  timeZone: string;
  /** The apps the visitor connected (Cookbook, Shopping), when the host offers links. */
  links: PluginLinksApi | undefined;
  /** Invitation emails (ADR 0073), for members with full access on hosts that offer them. */
  invitations: PluginInvitations | undefined;
  /** This app's address, e.g. https://canteen.devquake.com. */
  baseUrl: string;
}

/**
 * Wraps an API handler: requires a signed-in user and the plugin database, turns HttpError into
 * JSON errors in the visitor's language and plain return values into JSON (undefined → 204).
 * Nothing the app answers is cached: it is personal data.
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
        grantInvitedAccess: ctx.grantInvitedAccess,
        locale: localeOf(ctx),
        timeZone: ctx.timeZone || 'UTC',
        links: ctx.links,
        invitations: ctx.invitations,
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
