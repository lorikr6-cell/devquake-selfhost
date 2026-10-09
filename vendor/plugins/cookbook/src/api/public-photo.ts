import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { readPublicPhoto } from '../lib/data';
import { HttpError } from '../lib/http';
import { wantsThumb } from '../lib/picture';

// GET /api/p/:code/photo[?size=thumb]: the photo of a publicly linked recipe, for anyone (an open
// route, ADR 0047); also the picture networks show in their link previews.
export const GET: PluginApiHandler = async (request, { params, ctx }) => {
  if (!ctx.db) return new Response(null, { status: 503 });
  try {
    const picture = await readPublicPhoto(ctx.db, params.code ?? '', wantsThumb(request));
    return new Response(new Uint8Array(picture.data), {
      headers: {
        'Content-Type': picture.mime,
        // Short: a link that stops being public stops showing the picture soon after.
        'Cache-Control': 'public, max-age=600',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch (err) {
    if (err instanceof HttpError) return new Response(null, { status: 404 });
    throw err;
  }
};
