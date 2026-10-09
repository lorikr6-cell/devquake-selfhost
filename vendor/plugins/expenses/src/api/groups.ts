import { api } from '../lib/api';
import { createGroup } from '../lib/data';
import { groupInput, readBody } from '../lib/validate';

// POST /api/groups { name, kind, currency }: a new group with the visitor as its owner.
export const POST = api(async ({ request, db, user }) => {
  const id = await createGroup(db, user, groupInput(await readBody(request)));
  return { id };
});
