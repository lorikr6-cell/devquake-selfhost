import { api } from '../lib/api';
import { deleteDocument, readDocument, saveDocument } from '../lib/data';
import { HttpError } from '../lib/http';
import { documentFromSlug } from '../lib/model';
import { pictureResponse, readPicture, wantsThumb } from '../lib/picture';
import { id } from '../lib/validate';

const kindOf = (slug: string | undefined) => {
  const kind = documentFromSlug(slug);
  if (!kind) throw new HttpError(404, 'notFound');
  return kind;
};

// GET /api/orgs/:id/people/:personId/documents/:kind[?size=thumb]: photo, id-card, extra1,
// extra2. The photo for everyone who sees profiles; the rest for organisers, logged.
export const GET = api(async ({ request, params, db, user }) =>
  pictureResponse(
    await readDocument(
      db,
      id(params.id),
      id(params.personId),
      kindOf(params.kind),
      user.id,
      wantsThumb(request),
    ),
  ),
);

// PUT … with the picture (multipart photo + thumb, as photoUpload sends it): stored encrypted.
export const PUT = api(async ({ request, params, db, user }) => {
  const picture = await readPicture(request);
  await saveDocument(db, id(params.id), id(params.personId), kindOf(params.kind), user.id, picture);
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteDocument(db, id(params.id), id(params.personId), kindOf(params.kind), user.id);
});
