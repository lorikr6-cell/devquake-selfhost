import { api } from '../lib/api';
import { addApplicant } from '../lib/social-data';
import { id, personInput, readBody } from '../lib/validate';

// POST /api/orgs/:id/social/applicants { ...a person }: a new applicant on the waiting list.
export const POST = api(async ({ request, params, db, user, today }) => ({
  id: await addApplicant(db, id(params.id), user.id, personInput(await readBody(request), today)),
}));
