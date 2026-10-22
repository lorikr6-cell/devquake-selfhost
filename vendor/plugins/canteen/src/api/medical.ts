import { api } from '../lib/api';
import { saveProfile } from '../lib/medical-data';
import { profileInput } from '../lib/medical-input';
import { id, readBody } from '../lib/validate';

// PUT /api/orgs/:id/people/:personId/medical: the medical profile (medical staff; encrypted).
export const PUT = api(async ({ request, params, db, user }) => {
  await saveProfile(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    profileInput(await readBody(request)),
  );
});
