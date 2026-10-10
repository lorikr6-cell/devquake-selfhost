import { api } from '../lib/api';
import { acceptInvite } from '../lib/team-data';
import { readBody } from '../lib/validate';

// POST /api/join { code }: the signed-in member joins the team the invitation is for.
export const POST = api(null, async ({ request, db, user }) => {
  const { code } = await readBody(request);
  await acceptInvite(db, typeof code === 'string' ? code : '', user);
});
