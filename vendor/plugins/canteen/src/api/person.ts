import { api } from '../lib/api';
import { deletePerson, updatePerson } from '../lib/data';
import { id, personInput, readBody } from '../lib/validate';

// PATCH /api/orgs/:id/people/:personId: organisers and coordinators change the profile.
export const PATCH = api(async ({ request, params, db, user, today }) => {
  await updatePerson(
    db,
    id(params.id),
    id(params.personId),
    user.id,
    personInput(await readBody(request), today),
  );
});

// DELETE …: an organiser deletes the person with their documents and incidents.
export const DELETE = api(async ({ params, db, user }) => {
  await deletePerson(db, id(params.id), id(params.personId), user.id);
});
