import { api } from '../lib/api';
import { addMedNote } from '../lib/medical-data';
import { id, incidentInput, readBody } from '../lib/validate';

// POST /api/orgs/:id/people/:personId/med-notes { occurredAt (UTC), note }: medical staff.
export const POST = api(async ({ request, params, db, user }) => {
  await addMedNote(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    incidentInput(await readBody(request)),
  );
});
