import { api } from '../lib/api';
import { deleteLogo, readLogo, saveLogo } from '../lib/org-page';
import { pictureResponse, readPicture } from '../lib/picture';
import { id } from '../lib/validate';

// GET /api/orgs/:id/logo: the organisation's logo for its staff.
export const GET = api(async ({ params, db, user }) =>
  pictureResponse(await readLogo(db, id(params.id), user.id)),
);

// PUT … (multipart photo, as photoUpload sends it): organisers change the logo.
export const PUT = api(async ({ request, params, db, user }) => {
  await saveLogo(db, id(params.id), user.id, await readPicture(request));
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteLogo(db, id(params.id), user.id);
});
