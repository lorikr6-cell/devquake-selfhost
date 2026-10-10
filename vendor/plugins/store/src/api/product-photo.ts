import { api, mine } from '../lib/api';
import { deletePhoto, makeFirstPhoto, readPhoto } from '../lib/data';
import { HttpError } from '../lib/http';
import { pictureResponse, wantsThumb } from '../lib/picture';
import { id } from '../lib/validate';

// GET /api/products/:id/photos/:photoId[?size=thumb]: the owner sees photos of drafts too.
export const GET = api('products', async ({ request, params, db, store }) => {
  const photo = await readPhoto(
    db,
    id(params.photoId),
    { storeId: mine(store).id, publicOnly: false },
    wantsThumb(request),
  );
  if (!photo) throw new HttpError(404, 'notFound');
  return pictureResponse(request, photo);
});

// PATCH /api/products/:id/photos/:photoId: makes it the product's first photo.
export const PATCH = api('products', async ({ params, db, store }) => {
  await makeFirstPhoto(db, mine(store).id, id(params.id), id(params.photoId));
});

export const DELETE = api('products', async ({ params, db, store }) => {
  await deletePhoto(db, mine(store).id, id(params.id), id(params.photoId));
});
