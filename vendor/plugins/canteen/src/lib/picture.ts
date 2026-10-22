import { MAX_PHOTO_BYTES, sniffPhoto, type PhotoMime } from './files';
import { HttpError } from './http';

/** The small version sent with a photo (photoUpload in @devquake/ui, ADR 0040). */
export const MAX_THUMB_BYTES = 400 * 1024;

export interface Picture {
  mime: PhotoMime;
  data: Uint8Array;
  /** Its small version for lists and previews; null when the browser sent none. */
  thumb: { mime: PhotoMime; data: Uint8Array } | null;
}

async function checked(blob: Blob, max: number): Promise<{ mime: PhotoMime; data: Uint8Array }> {
  if (blob.size > max) throw new HttpError(413, 'photoTooLarge');
  const data = new Uint8Array(await blob.arrayBuffer());
  const mime = sniffPhoto(data);
  if (!mime) throw new HttpError(415, 'photoType');
  return { mime, data };
}

/**
 * The uploaded picture, checked by size and content: a multipart form with `photo` and its
 * small version `thumb` (photoUpload), or, from older pages, the image alone as the body.
 */
export async function readPicture(request: Request): Promise<Picture> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_PHOTO_BYTES + MAX_THUMB_BYTES + 64 * 1024) {
    throw new HttpError(413, 'photoTooLarge');
  }
  if ((request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) {
    const form = await request.formData().catch(() => null);
    const photo = form?.get('photo');
    if (!(photo instanceof Blob)) throw new HttpError(415, 'photoType');
    const thumb = form?.get('thumb');
    return {
      ...(await checked(photo, MAX_PHOTO_BYTES)),
      thumb: thumb instanceof Blob && thumb.size > 0 ? await checked(thumb, MAX_THUMB_BYTES) : null,
    };
  }
  return { ...(await checked(await request.blob(), MAX_PHOTO_BYTES)), thumb: null };
}

/** Whether the request asks for the small version (`?size=thumb`). */
export function wantsThumb(request: Request): boolean {
  return new URL(request.url).searchParams.get('size') === 'thumb';
}

/**
 * A stored picture as an image response. Personal documents are never kept in a cache: each
 * view goes through the role check (and the access log for ID cards and papers).
 */
export function pictureResponse(picture: { mime: string; data: Buffer }) {
  return new Response(new Uint8Array(picture.data), {
    headers: {
      'Content-Type': picture.mime,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
