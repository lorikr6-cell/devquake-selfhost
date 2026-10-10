import { shopApi } from '../lib/api';
import { readPhoto } from '../lib/data';
import { HttpError } from '../lib/http';
import { wantsThumb } from '../lib/picture';
import { id } from '../lib/validate';

// GET /api/s/:slug/photos/:photoId[?size=thumb]: a published product's photo, for anyone (an
// open route) and for search engines and link previews.
export const GET = shopApi(async ({ request, params, db, store }) => {
  const photo = await readPhoto(
    db,
    id(params.photoId),
    { storeId: store.id, publicOnly: true },
    wantsThumb(request),
  );
  if (!photo) throw new HttpError(404, 'notFound');
  return new Response(new Uint8Array(photo.data), {
    headers: {
      'Content-Type': photo.mime,
      // Photos never change under their id; a removed one is gone within the hour.
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
});
