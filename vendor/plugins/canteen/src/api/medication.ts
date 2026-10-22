import { api } from '../lib/api';
import { deleteMedication, saveMedication } from '../lib/medical-data';
import { medicationInput } from '../lib/medical-input';
import { id, readBody } from '../lib/validate';

// PATCH /api/orgs/:id/people/:personId/medications/:medicationId: changes it (e.g. its end).
export const PATCH = api(async ({ request, params, db, user }) => {
  await saveMedication(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    medicationInput(await readBody(request)),
    id(params.medicationId),
  );
});

// DELETE …: removes a medicine entered by mistake, with its administration record.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteMedication(db, id(params.id), id(params.personId), id(params.medicationId), user.id);
});
