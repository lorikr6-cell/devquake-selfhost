import { shopApi } from '../lib/api';
import { isAssetKind, readAsset } from '../lib/data';
import { HttpError } from '../lib/http';

// GET /api/s/:slug/assets/:kind (logo | banner): an open shop's picture. Versioned addresses
// (?v=) are cached; they change with every new upload.
export const GET = shopApi(
  async ({ params, db, store }) => {
    if (!isAssetKind(params.kind)) throw new HttpError(404, 'notFound');
    const asset = await readAsset(db, store.id, params.kind);
    if (!asset) throw new HttpError(404, 'notFound');
    return new Response(new Uint8Array(asset.data), {
      headers: {
        'Content-Type': asset.mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  },
  { limit: 240 },
);
