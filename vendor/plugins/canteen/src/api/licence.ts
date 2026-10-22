import { api } from '../lib/api';
import { isIsoDate } from '../lib/dates';
import { HttpError } from '../lib/http';
import { deleteLicence, readLicencePicture, saveLicence } from '../lib/licence-data';
import { MAX_PHOTO_BYTES, sniffPhoto } from '../lib/files';
import { MAX_THUMB_BYTES, pictureResponse, wantsThumb } from '../lib/picture';
import { id } from '../lib/validate';

// GET /api/orgs/:id/drivers/:driverId/licence[?size=thumb]: the licence picture (planners, or
// the driver themselves). Never cached.
export const GET = api(async ({ request, params, db, user }) =>
  pictureResponse(
    await readLicencePicture(db, id(params.id), id(params.driverId), user.id, wantsThumb(request)),
  ),
);

async function image(blob: FormDataEntryValue | null, max: number) {
  if (!(blob instanceof Blob)) return null;
  if (blob.size > max) throw new HttpError(413, 'photoTooLarge');
  const data = new Uint8Array(await blob.arrayBuffer());
  const mime = sniffPhoto(data);
  if (!mime) throw new HttpError(415, 'photoType');
  return { mime, data };
}

// PUT … (multipart: photo, thumb, expiresOn, number, nameChecked): the licence as read on the
// device and confirmed; stored encrypted. An expired licence is refused.
export const PUT = api(async ({ request, params, db, user, today }) => {
  if (
    Number(request.headers.get('content-length') ?? 0) >
    MAX_PHOTO_BYTES + MAX_THUMB_BYTES + 64 * 1024
  ) {
    throw new HttpError(413, 'photoTooLarge');
  }
  const form = await request.formData().catch(() => null);
  const photo = await image(form?.get('photo') ?? null, MAX_PHOTO_BYTES);
  if (!photo) throw new HttpError(415, 'photoType');
  const thumb = await image(form?.get('thumb') ?? null, MAX_THUMB_BYTES);
  const expiresOn = String(form?.get('expiresOn') ?? '');
  if (!isIsoDate(expiresOn)) throw new HttpError(400, 'date', { field: 'licenceExpiry' });
  const number = String(form?.get('number') ?? '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 20);
  await saveLicence(
    db,
    id(params.id),
    id(params.driverId),
    user.id,
    today,
    { ...photo, thumb },
    {
      expiresOn,
      number: number || null,
      nameChecked: form?.get('nameChecked') === 'true',
    },
  );
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteLicence(db, id(params.id), id(params.driverId), user.id);
});
