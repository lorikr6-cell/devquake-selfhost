// Shrinking photos in the browser before upload (shopping products, community ideas).
// Browser-only: call it from client components.

const MAX_SIDE = 1280;
const QUALITY = 0.82;

/**
 * Shrinks a photo in the browser before uploading (phone photos are often 3-8 MB): at most
 * 1280 px on the longest side, JPEG. The image is drawn upright (EXIF orientation applied).
 */
export async function shrinkPhoto(
  file: File,
  maxSide = MAX_SIDE,
  quality = QUALITY,
): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo (JPEG, PNG or WebP).');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This photo could not be read. Try a JPEG or PNG.');
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot prepare photos.');
  context.fillStyle = '#FFFFFF'; // transparent PNGs get a white background in JPEG
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) throw new Error('This photo could not be prepared.');
  return blob;
}

/** Longest side of the small version sent with every photo (lists, avatars, previews). */
export const THUMB_SIDE = 480;

/**
 * A photo ready to upload with its small version (ADR 0040): form fields `photo` (shrunk like
 * shrinkPhoto) and `thumb` (at most THUMB_SIDE px). Apps store both and show the small one in
 * lists and previews; the full one opens on tap. Send it as the request body (multipart).
 */
export async function photoUpload(
  file: File,
  maxSide = MAX_SIDE,
  quality = QUALITY,
): Promise<FormData> {
  const [photo, thumb] = await Promise.all([
    shrinkPhoto(file, maxSide, quality),
    shrinkPhoto(file, Math.min(THUMB_SIDE, maxSide), 0.78),
  ]);
  const form = new FormData();
  form.append('photo', photo, 'photo.jpg');
  form.append('thumb', thumb, 'thumb.jpg');
  return form;
}

/** The small version of a picture URL (`?size=thumb`; the full one when none was stored). */
export function thumbUrl(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}size=thumb`;
}
