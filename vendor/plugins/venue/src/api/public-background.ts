import type { PluginApiHandler } from '@devquake/plugin-sdk';
import { venueBySlug } from '../lib/data';
import { designOf, readBackground } from '../lib/design';

// GET /api/menu-bg/:slug?v=…: the background of a venue's public menu (an open route), only while
// the menu is public and the owner shows the design there. The address changes with it (?v).
export const GET: PluginApiHandler = async (_request, { params, ctx }) => {
  const gone = () => new Response(null, { status: 404 });
  if (!ctx.db) return gone();
  const venue = await venueBySlug(ctx.db, params.slug ?? '');
  if (!venue?.menuPublic) return gone();
  const design = await designOf(ctx.db, venue.id);
  if (!design.onPublic) return gone();
  const bg = await readBackground(ctx.db, venue.id);
  if (!bg) return gone();
  return new Response(new Uint8Array(bg.data), {
    headers: {
      'Content-Type': bg.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
};
