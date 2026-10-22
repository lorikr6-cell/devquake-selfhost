import { api } from '../lib/api';
import { saveStay } from '../lib/medical-data';
import { stayInput } from '../lib/medical-input';
import { id, readBody } from '../lib/validate';

// PATCH /api/orgs/:id/people/:personId/hospital-stays/:stayId: e.g. the return, the verdict.
export const PATCH = api(async ({ request, params, db, user }) => {
  await saveStay(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    stayInput(await readBody(request)),
    id(params.stayId),
  );
});
