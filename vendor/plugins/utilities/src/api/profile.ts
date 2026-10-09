import { api } from '../lib/api';
import { getProfile, saveProfile } from '../lib/data';
import { profileInput, readBody } from '../lib/validate';

// GET /api/profile: my name and address. PUT /api/profile { fullName, address }: save them.
export const GET = api(async ({ db, user }) => ({ profile: await getProfile(db, user.id) }));

export const PUT = api(async ({ request, db, user }) => {
  await saveProfile(db, user.id, profileInput(await readBody(request)));
});
