import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { deletePhoto, readPhoto, savePhoto } from '../lib/mutations';
import { MAX_PHOTO_BYTES, MAX_THUMB_BYTES, readUpload } from '../lib/photos';
import { id } from '../lib/validate';

// GET /api/lists/:id/items/:itemId/photo[?v=...][&size=thumb]: the product photo, or its small
// version (list members only). The address changes with every new photo (?v), so browsers may
// keep it for a long time.
export const GET = api(async ({ request, params, db, user }) => {
  const thumb = new URL(request.url).searchParams.get('size') === 'thumb';
  const photo = await readPhoto(db, id(params.id), id(params.itemId), user.id, thumb);
  const versioned = new URL(request.url).searchParams.has('v');
  return new Response(new Uint8Array(photo.data), {
    headers: {
      'Content-Type': photo.mime,
      'Cache-Control': versioned ? 'private, max-age=31536000, immutable' : 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
});

// PUT /api/lists/:id/items/:itemId/photo with the photo and its small version (multipart), or
// the image alone as the body (JPEG, PNG, WebP).
export const PUT = api(async ({ request, params, db, user }) => {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_PHOTO_BYTES + MAX_THUMB_BYTES + 64 * 1024) {
    throw new HttpError(413, 'photoTooLarge');
  }
  const { bytes, thumb } = await readUpload(request);
  await savePhoto(db, id(params.id), id(params.itemId), user, bytes, thumb);
});

export const DELETE = api(async ({ params, db, user }) => {
  await deletePhoto(db, id(params.id), id(params.itemId), user);
});
