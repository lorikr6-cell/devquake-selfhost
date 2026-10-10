import { shopApi } from '../lib/api';
import { firstPhotos, sellableVariants } from '../lib/data';
import { priceNow } from '../lib/pricing';

// GET /api/s/:slug/cart?v=1,2,3: what the browser's cart holds, as it is now (prices, sales,
// stock, the first photo). An open route: the cart lives in the buyer's browser.
export const GET = shopApi(
  async ({ request, db, store }) => {
    const ids = (new URL(request.url).searchParams.get('v') ?? '')
      .split(',')
      .map(Number)
      .filter((n) => Number.isSafeInteger(n) && n > 0)
      .slice(0, 50);
    const variants = await sellableVariants(db, store.id, ids);
    const photos = await firstPhotos(db, store.id, [...new Set(variants.map((v) => v.productId))]);
    const now = new Date();
    return {
      items: variants.map((v) => {
        const p = priceNow(v, now);
        return {
          variantId: v.variantId,
          productId: v.productId,
          name: v.productName,
          slug: v.productSlug ?? '',
          optionName: v.optionName,
          available: v.available,
          cents: p.cents,
          regularCents: p.regularCents,
          onSale: p.onSale,
          stock: v.stock,
          photoId: photos.get(v.productId) ?? null,
        };
      }),
    };
  },
  { limit: 120 },
);
