import { api } from '../lib/api';
import { createHousehold } from '../lib/data';
import { LIMITS } from '../lib/plan';
import { readBody, requiredText } from '../lib/validate';

// POST /api/households { name }: a new household; the visitor plans it and eats in it.
export const POST = api(async ({ request, db, user, timeZone }) => {
  const body = await readBody(request);
  const name = requiredText(body.name, 'householdName', LIMITS.householdName);
  return { id: await createHousehold(db, user, name, timeZone) };
});
