import { api } from '../lib/api';
import { getProfile, saveProfile } from '../lib/data/profiles';
import { profile, readBody } from '../lib/validate';

// GET /api/profile: the player's profile (null before it is set up).
export const GET = api(async ({ db, user }) => ({ profile: await getProfile(db, user.id) }));

// PUT /api/profile: set up or change the profile.
export const PUT = api(async ({ request, db, user }) => {
  await saveProfile(db, user.id, profile(await readBody(request)));
});
