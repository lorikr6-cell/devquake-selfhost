import { api } from '../lib/api';
import { deleteIncident } from '../lib/data';
import { id } from '../lib/validate';

// DELETE /api/orgs/:id/people/:personId/incidents/:incidentId: its author or an organiser.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteIncident(db, id(params.id), id(params.personId), id(params.incidentId), user.id);
});
