import { api } from '../lib/api';
import { createOrg } from '../lib/data';
import { orgInput, readBody } from '../lib/validate';

// POST /api/orgs { name }: a new organisation with the visitor as its organiser.
export const POST = api(async ({ request, db, user }) => {
  const id = await createOrg(db, user, orgInput(await readBody(request)));
  return { id };
});
