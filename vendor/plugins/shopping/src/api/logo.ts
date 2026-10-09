import { api } from '../lib/api';
import { readLogo } from '../lib/logos';

// GET /api/logos/:key: a store's logo (ADR 0052). A raster image checked when it was stored.
export const GET = api(async ({ params, db }) => {
  const logo = await readLogo(db, params.key ?? '');
  return new Response(new Uint8Array(logo.data), {
    headers: {
      'Content-Type': logo.content_type,
      'Cache-Control': 'private, max-age=604800',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
});
