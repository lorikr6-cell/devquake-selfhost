import { api } from '../lib/api';
import { deleteHeaderImage, readHeaderImage, saveHeaderImage } from '../lib/org-page';
import { pictureResponse, readPicture } from '../lib/picture';
import { id } from '../lib/validate';

// GET /api/orgs/:id/header-image: the header's background picture for the staff.
export const GET = api(async ({ params, db, user }) =>
  pictureResponse(await readHeaderImage(db, id(params.id), user.id)),
);

// PUT … (multipart photo, shrunk in the browser by photoUpload): organisers change it.
export const PUT = api(async ({ request, params, db, user }) => {
  await saveHeaderImage(db, id(params.id), user.id, await readPicture(request));
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteHeaderImage(db, id(params.id), user.id);
});
