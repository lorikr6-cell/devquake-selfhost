import { api } from '../lib/api';
import { createPerson } from '../lib/data';
import { id, personInput, readBody } from '../lib/validate';

// POST /api/orgs/:id/people { firstName, lastName, … }: organisers and coordinators.
export const POST = api(async ({ request, params, db, user, today }) => {
  const personId = await createPerson(
    db,
    id(params.id),
    user.id,
    personInput(await readBody(request), today),
  );
  return { id: personId };
});
