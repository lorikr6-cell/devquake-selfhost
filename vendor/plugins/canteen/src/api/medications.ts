import { api } from '../lib/api';
import { saveMedication } from '../lib/medical-data';
import { medicationInput } from '../lib/medical-input';
import { id, readBody } from '../lib/validate';

// POST /api/orgs/:id/people/:personId/medications { name, dose, times: "08:00, 20:00",
// startsOn, endsOn?, notes? }: medical staff add a medicine.
export const POST = api(async ({ request, params, db, user }) => {
  const medicationId = await saveMedication(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    medicationInput(await readBody(request)),
  );
  return { id: medicationId };
});
