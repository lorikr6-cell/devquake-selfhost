import { api } from '../lib/api';
import { saveStay } from '../lib/medical-data';
import { stayInput } from '../lib/medical-input';
import { id, readBody } from '../lib/validate';

// POST /api/orgs/:id/people/:personId/hospital-stays: medical staff record a hospital stay.
export const POST = api(async ({ request, params, db, user }) => {
  const stayId = await saveStay(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    stayInput(await readBody(request)),
  );
  return { id: stayId };
});
