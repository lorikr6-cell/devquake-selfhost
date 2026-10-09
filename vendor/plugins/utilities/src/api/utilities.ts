import { api } from '../lib/api';
import { createUtility, hasCompleteProfile, overviewForUser } from '../lib/data';
import { HttpError } from '../lib/http';
import { readBody, utilityInput } from '../lib/validate';

// GET /api/utilities: my utilities and my part of every bill. POST /api/utilities: create one.
export const GET = api(async ({ db, user }) => overviewForUser(db, user.id));

export const POST = api(async ({ request, db, user }) => {
  if (!(await hasCompleteProfile(db, user.id))) throw new HttpError(400, 'profileRequired');
  const id = await createUtility(db, user, utilityInput(await readBody(request)));
  return Response.json({ id }, { status: 201 });
});
