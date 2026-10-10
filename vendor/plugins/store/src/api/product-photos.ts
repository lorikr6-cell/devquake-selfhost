import { api, mine } from '../lib/api';
import { addPhoto } from '../lib/data';
import { readPicture } from '../lib/picture';
import { id } from '../lib/validate';

// POST /api/products/:id/photos (multipart photo + thumb, photoUpload): adds a photo.
export const POST = api('products', async ({ request, params, db, store }) => {
  const photoId = await addPhoto(db, mine(store).id, id(params.id), await readPicture(request));
  return { id: photoId };
});
