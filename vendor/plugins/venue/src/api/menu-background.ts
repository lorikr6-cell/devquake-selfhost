import { ownerApi } from '../lib/api';
import { BG_MAX_BYTES, readBackground, saveBackground, sniffImage } from '../lib/design';
import { HttpError } from '../lib/http';

// The menu's flattened background (the owner's): GET it, PUT a new one (flattened in the browser,
// at most 2 MB, checked by its content), DELETE it. Kept in the database, never on disk.

export const GET = ownerApi(async ({ db, venue }) => {
  const bg = await readBackground(db, venue.id);
  if (!bg) throw new HttpError(404, 'notFound');
  return new Response(new Uint8Array(bg.data), {
    headers: {
      'Content-Type': bg.mime,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
});

export const PUT = ownerApi(async ({ request, db, venue }) => {
  if (Number(request.headers.get('content-length') ?? 0) > BG_MAX_BYTES)
    throw new HttpError(413, 'imageTooLarge');
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > BG_MAX_BYTES) throw new HttpError(413, 'imageTooLarge');
  const mime = sniffImage(bytes);
  if (!mime) throw new HttpError(415, 'imageType');
  await saveBackground(db, venue.id, { mime, data: bytes });
});

export const DELETE = ownerApi(async ({ db, venue }) => {
  await saveBackground(db, venue.id, null);
});
