import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { HttpError } from '../lib/http';
import { readLogo } from '../lib/org-page';
import { pictureResponse } from '../lib/picture';

// GET /api/o/:id/logo: an open route (ADR 0047): the logo of an organisation whose page is
// public, for anyone; 404 for everything else, never a hint.
export const GET: PluginApiHandler = async (_request, { params, ctx }) => {
  const orgId = Number(params.id);
  if (!ctx.db || !Number.isSafeInteger(orgId) || orgId <= 0) {
    return new Response(null, { status: 404 });
  }
  try {
    return pictureResponse(await readLogo(ctx.db, orgId, ctx.user?.id ?? null));
  } catch (err) {
    if (err instanceof HttpError) return new Response(null, { status: 404 });
    throw err;
  }
};
