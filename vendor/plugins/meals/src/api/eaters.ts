import { api } from '../lib/api';
import { addEater } from '../lib/data';
import { eaterInput, id, readBody } from '../lib/validate';

// POST /api/households/:id/eaters { name, portion }: planners.
export const POST = api(async ({ request, params, db, user }) => {
  const { name, portion } = eaterInput(await readBody(request));
  return { id: await addEater(db, id(params.id), user.id, name, portion) };
});
