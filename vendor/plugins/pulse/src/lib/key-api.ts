import { after } from 'next/server';
import type { PluginApiArgs, PluginApiHandler, PluginDatabase } from '@devquake/plugin-sdk';
import { recordCall } from './call-log';
import { apiRoute } from './call-rules';
import { ApiError, apiErrorResponse, identify, type Caller } from './gateway';

type Db = Omit<PluginDatabase, 'transaction'>;

/**
 * Wraps a public API handler (ADR 0023): identifies the caller (key, token or secret) and turns
 * ApiError into the documented JSON error, readable by the calling page (CORS). Every call is
 * logged and counted (lib/call-log.ts) after the answer is sent, refused ones too.
 */
export function keyApi(
  fn: (scope: {
    request: Request;
    db: Db;
    caller: Caller;
    query: URLSearchParams;
  }) => Promise<Response>,
): PluginApiHandler {
  return async (request: Request, { ctx }: PluginApiArgs) => {
    const origin = request.headers.get('origin');
    if (!ctx.db) return apiErrorResponse(new ApiError(503, 'unavailable'), origin);
    const db = ctx.db;
    const started = Date.now();
    const query = new URL(request.url).searchParams;
    let caller: Caller | null = null;
    const log = (status: number) =>
      after(() =>
        recordCall(db, {
          appId: caller ? Number(caller.entry.app.id) : null,
          method: request.method,
          route: apiRoute(request.url),
          status,
          source: caller?.source ?? null,
          durationMs: Date.now() - started,
        }),
      );
    try {
      caller = await identify(request, ctx, db, query);
      const response = await fn({ request, db, caller, query });
      log(response.status);
      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        log(err.status);
        return apiErrorResponse(err, origin);
      }
      log(500);
      throw err; // the host logs it and answers 500
    }
  };
}
