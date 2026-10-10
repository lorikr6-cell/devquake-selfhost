import { plainQrSvg } from '@devquake/ui/qr';
import { shopApi } from '../lib/api';
import { productBySlug } from '../lib/data';
import { HttpError } from '../lib/http';

// GET /api/s/:slug/p/:product/qr[?download=1]: a QR code (SVG) of the product's page, for
// shelves, flyers and packaging. Scans are counted as visits from "qr".
export const GET = shopApi(
  async ({ request, params, db, store, ctx }) => {
    const product = await productBySlug(db, store.id, params.product ?? '');
    if (!product || !product.published) throw new HttpError(404, 'productNotFound');
    const url = `${ctx.baseUrl}/s/${store.slug}/p/${product.slug}?utm_source=qr&utm_medium=print`;
    const download = new URL(request.url).searchParams.has('download');
    return new Response(plainQrSvg(url, { margin: 2, title: product.name }), {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        ...(download
          ? { 'Content-Disposition': `attachment; filename="qr-${product.slug}.svg"` }
          : {}),
      },
    });
  },
  { limit: 60 },
);
