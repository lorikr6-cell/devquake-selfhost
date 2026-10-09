import { api, readBytes } from '../lib/api';
import { readReadingPhoto, saveReadingPhoto } from '../lib/data';
import { MAX_PHOTO_BYTES, sniffPhoto } from '../lib/files';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// GET /api/bills/:id/readings/:userId/photo[?v=...][&size=thumb]: the meter photo, or its small
// version (everyone on the utility, to check a reading). The address changes with every new
// photo (?v).
export const GET = api(async ({ request, params, db, user }) => {
  const thumb = new URL(request.url).searchParams.get('size') === 'thumb';
  const photo = await readReadingPhoto(db, id(params.id), user.id, id(params.userId), thumb);
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

/** The small version sent with a photo (ADR 0040). */
const MAX_THUMB_BYTES = 400 * 1024;

// PUT with the photo and its small version (multipart: photo, thumb), or the image alone as
// the body (JPEG, PNG or WebP, shrunk in the browser first).
export const PUT = api(async ({ request, params, db, user }) => {
  let bytes: Uint8Array;
  let small: Uint8Array | null = null;
  if ((request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) {
    const form = await request.formData().catch(() => null);
    const photo = form?.get('photo');
    const thumb = form?.get('thumb');
    if (!(photo instanceof Blob) || photo.size === 0) throw new HttpError(400, 'emptyFile');
    if (photo.size > MAX_PHOTO_BYTES) throw new HttpError(413, 'photoTooLarge');
    bytes = new Uint8Array(await photo.arrayBuffer());
    if (thumb instanceof Blob && thumb.size > 0 && thumb.size <= MAX_THUMB_BYTES) {
      small = new Uint8Array(await thumb.arrayBuffer());
    }
  } else {
    bytes = await readBytes(request, MAX_PHOTO_BYTES, 'photoTooLarge');
  }
  const mime = sniffPhoto(bytes);
  if (!mime) throw new HttpError(400, 'photoType');
  const thumbMime = small ? sniffPhoto(small) : null;
  await saveReadingPhoto(db, id(params.id), user, id(params.userId), mime, bytes, {
    mime: thumbMime,
    data: thumbMime ? small : null,
  });
});
