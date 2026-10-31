import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { deleteVisit, updateVisit } from '../lib/social-data';
import { id, readBody } from '../lib/validate';

// PATCH /api/orgs/:id/visits/:visitId { status?, notes? }: done (with notes), cancelled, or the
// notes changed. DELETE removes a visit planned by mistake.
export const PATCH = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const status = body.status;
  if (status !== undefined && status !== 'planned' && status !== 'done' && status !== 'cancelled') {
    throw new HttpError(400, 'invalidRequest');
  }
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
    throw new HttpError(400, 'invalidRequest');
  }
  await updateVisit(db, id(params.id), user.id, id(params.visitId), {
    status,
    notes: body.notes as string | null | undefined,
  });
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteVisit(db, id(params.id), user.id, id(params.visitId));
});
