import { api } from '../lib/api';
import { addIncident } from '../lib/data';
import { id, incidentInput, readBody } from '../lib/validate';

// POST /api/orgs/:id/people/:personId/incidents { occurredAt (UTC), note }.
export const POST = api(async ({ request, params, db, user }) => {
  const incidentId = await addIncident(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    incidentInput(await readBody(request)),
  );
  return { id: incidentId };
});
