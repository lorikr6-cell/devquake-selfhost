import { ownerApi } from '../lib/api';
import { listTablets, revokeTablet } from '../lib/data';
import { HttpError } from '../lib/http';

// DELETE /api/tablets/:id: disables a tablet at once (a lost or replaced one).
export const DELETE = ownerApi(async ({ params, db, venue }) => {
  if (!(await revokeTablet(db, venue.id, Number(params.id)))) throw new HttpError(404, 'notFound');
  return { tablets: await listTablets(db, venue.id) };
});
